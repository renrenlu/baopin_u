"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  localDateKey,
  readTrainingActivity,
  type TrainingActivity,
  writeTrainingActivity,
} from "./training-activity";

type HistoryQuestion = {
  id: number;
  correct: string;
};

type HistoryIssue = {
  date: string;
  title: string;
  questions: HistoryQuestion[];
};

type SavedProgress = {
  choices?: Record<string, string>;
  revealed?: number[];
  updatedAt?: string;
  completedAt?: string;
};

type DailyResult = {
  date: string;
  title: string;
  answered: number;
  correct: number;
  wrong: number;
  total: number;
  reviewed: number;
  completed: boolean;
  score: number;
};

type TrainingHistoryProps = {
  issues: HistoryIssue[];
  basePath: string;
};

type HeatmapDay = {
  date: string;
  count: number;
  level: number;
  future: boolean;
};

type HeatmapWeek = {
  month?: string;
  days: HeatmapDay[];
};

const ACTIVITY_MIGRATION_KEY = "baopin-hook-training-activity-migrated:v1";

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function formatActivityDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function readSavedProgress(issue: HistoryIssue): SavedProgress {
  try {
    return JSON.parse(
      window.localStorage.getItem(`baopin-hook-training:${issue.date}`) ?? "{}",
    ) as SavedProgress;
  } catch {
    return {};
  }
}

function readResults(issues: HistoryIssue[]): DailyResult[] {
  return issues.map((issue) => {
    const saved = readSavedProgress(issue);
    const choices = saved.choices ?? {};
    const answered = issue.questions.filter((question) => Boolean(choices[String(question.id)])).length;
    const correct = issue.questions.filter(
      (question) => choices[String(question.id)] === question.correct,
    ).length;
    const total = issue.questions.length;
    const completed = answered === total;

    return {
      date: issue.date,
      title: issue.title,
      answered,
      correct,
      wrong: Math.max(0, answered - correct),
      total,
      reviewed: saved.revealed?.length ?? 0,
      completed,
      score: completed ? Math.round((correct / total) * 100) : 0,
    };
  });
}

function readActivityWithMigration(issues: HistoryIssue[]) {
  const activity = readTrainingActivity();
  if (window.localStorage.getItem(ACTIVITY_MIGRATION_KEY)) return activity;

  for (const issue of issues) {
    const saved = readSavedProgress(issue);
    const answered = issue.questions.filter(
      (question) => Boolean(saved.choices?.[String(question.id)]),
    ).length;
    if (!answered) continue;
    const updated = saved.updatedAt ? new Date(saved.updatedAt) : null;
    const date = updated && !Number.isNaN(updated.getTime())
      ? localDateKey(updated)
      : issue.date;
    activity[date] = (activity[date] ?? 0) + answered;
  }
  writeTrainingActivity(activity);
  window.localStorage.setItem(ACTIVITY_MIGRATION_KEY, "1");
  return activity;
}

function heatLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function buildHeatmap(activity: TrainingActivity): HeatmapWeek[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - today.getDay()));
  const start = new Date(end);
  start.setDate(end.getDate() - 370);

  const weeks: HeatmapWeek[] = [];
  let previousMonth = -1;
  for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
    const firstDay = new Date(start);
    firstDay.setDate(start.getDate() + weekIndex * 7);
    const month = firstDay.getMonth();
    const week: HeatmapWeek = {
      month: month !== previousMonth ? `${month + 1}月` : undefined,
      days: [],
    };
    previousMonth = month;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + dayIndex);
      const key = localDateKey(date);
      const count = activity[key] ?? 0;
      week.days.push({
        date: key,
        count,
        level: heatLevel(count),
        future: date > today,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

export default function TrainingHistory({ issues, basePath }: TrainingHistoryProps) {
  const [results, setResults] = useState<DailyResult[]>([]);
  const [activity, setActivity] = useState<TrainingActivity>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setResults(readResults(issues));
    setActivity(readActivityWithMigration(issues));
    setReady(true);
  }, [issues]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("baopin-hook-progress", refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("baopin-hook-progress", refresh);
    };
  }, [refresh]);

  const summary = useMemo(() => {
    const completed = results.filter((result) => result.completed);
    const activityCounts = Object.values(activity);
    const totalAnswered = activityCounts.reduce((sum, count) => sum + count, 0);
    const currentAnswered = results.reduce((sum, result) => sum + result.answered, 0);
    const totalCorrect = results.reduce((sum, result) => sum + result.correct, 0);
    return {
      practicedDays: activityCounts.filter((count) => count > 0).length,
      completedDays: completed.length,
      totalAnswered,
      accuracy: currentAnswered ? Math.round((totalCorrect / currentAnswered) * 100) : 0,
      scoredAnswers: currentAnswered,
    };
  }, [activity, results]);

  const heatmap = useMemo(
    () => ready ? buildHeatmap(activity) : [],
    [activity, ready],
  );

  return (
    <section className="training-history" aria-labelledby="training-history-title">
      <header className="training-history-heading">
        <div>
          <span>MY TRAINING · 本机记录</span>
          <h2 id="training-history-title">每日答题可视化</h2>
        </div>
        <p>正确、错误和未答一眼看清；记录只保存在当前浏览器。</p>
      </header>

      <div className="training-history-metrics" aria-label="训练汇总">
        <article>
          <span>练习天数</span>
          <strong>{ready ? summary.practicedDays : "—"}</strong>
          <small>天</small>
        </article>
        <article>
          <span>完成期数</span>
          <strong>{ready ? summary.completedDays : "—"}</strong>
          <small>期</small>
        </article>
        <article>
          <span>累计答题</span>
          <strong>{ready ? summary.totalAnswered : "—"}</strong>
          <small>题</small>
        </article>
        <article className="accent">
          <span>累计正确率</span>
          <strong>{ready && summary.scoredAnswers ? `${summary.accuracy}%` : "—"}</strong>
          <small>{summary.scoredAnswers ? "按当前答题记录" : "完成训练后生成"}</small>
        </article>
      </div>

      <section className="training-activity-heatmap" aria-labelledby="training-activity-title">
        <header>
          <div>
            <span>DAILY ACTIVITY</span>
            <h3 id="training-activity-title">过去一年答题活跃度</h3>
          </div>
          <p>每答完一道新题记一次；颜色越深，当天答得越多。</p>
        </header>
        {ready ? (
          <>
            <div className="training-heatmap-scroll">
              <div className="training-heatmap-months" aria-hidden="true">
                {heatmap.map((week, index) =>
                  week.month ? (
                    <span style={{ gridColumn: index + 1 }} key={`${week.month}-${index}`}>
                      {week.month}
                    </span>
                  ) : null
                )}
              </div>
              <div className="training-heatmap-grid" role="img" aria-label="过去一年每日答题数量热力图">
                {heatmap.flatMap((week) =>
                  week.days.map((day) => (
                    <i
                      className={`level-${day.level}${day.future ? " future" : ""}`}
                      title={`${formatActivityDate(day.date)}：${day.count} 题`}
                      aria-label={`${formatActivityDate(day.date)}答题 ${day.count} 道`}
                      key={day.date}
                    />
                  ))
                )}
              </div>
            </div>
            <footer>
              <span>过去一年共答 {summary.totalAnswered} 题</span>
              <div className="training-heatmap-scale" aria-label="颜色由浅到深表示答题数量由少到多">
                <span>少</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <i className={`level-${level}`} key={level} />
                ))}
                <span>多</span>
              </div>
            </footer>
          </>
        ) : (
          <p className="training-history-loading">正在读取每日答题记录…</p>
        )}
      </section>

      <div className="training-history-chart">
        <div className="training-history-legend" aria-hidden="true">
          <span className="correct">正确</span>
          <span className="wrong">错误</span>
          <span className="unanswered">未答</span>
        </div>

        {ready ? results.map((result) => {
          const correctWidth = (result.correct / result.total) * 100;
          const wrongWidth = (result.wrong / result.total) * 100;
          const unansweredWidth = Math.max(0, 100 - correctWidth - wrongWidth);
          return (
            <article className="training-history-row" key={result.date}>
              <a href={`${basePath}/hooks/${result.date.replaceAll("-", "")}/`}>
                <time dateTime={result.date}>{formatShortDate(result.date)}</time>
                <span>{result.completed ? `${result.score}%` : `${result.answered}/${result.total}`}</span>
              </a>
              <div
                className="training-history-bar"
                role="img"
                aria-label={`${formatShortDate(result.date)}：答对 ${result.correct} 题，答错 ${result.wrong} 题，未答 ${result.total - result.answered} 题`}
              >
                <i className="correct" style={{ width: `${correctWidth}%` }} />
                <i className="wrong" style={{ width: `${wrongWidth}%` }} />
                <i className="unanswered" style={{ width: `${unansweredWidth}%` }} />
              </div>
              <p>{result.completed ? "已完成" : result.answered ? "进行中" : "未开始"}</p>
            </article>
          );
        }) : (
          <p className="training-history-loading">正在读取本机训练记录…</p>
        )}
      </div>
    </section>
  );
}
