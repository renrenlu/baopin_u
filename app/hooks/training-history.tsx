"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function readResults(issues: HistoryIssue[]): DailyResult[] {
  return issues.map((issue) => {
    let saved: SavedProgress = {};
    try {
      saved = JSON.parse(
        window.localStorage.getItem(`baopin-hook-training:${issue.date}`) ?? "{}",
      ) as SavedProgress;
    } catch {
      saved = {};
    }

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

export default function TrainingHistory({ issues, basePath }: TrainingHistoryProps) {
  const [results, setResults] = useState<DailyResult[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setResults(readResults(issues));
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
    const practiced = results.filter((result) => result.answered > 0);
    const completed = results.filter((result) => result.completed);
    const totalAnswered = practiced.reduce((sum, result) => sum + result.answered, 0);
    const totalCorrect = practiced.reduce((sum, result) => sum + result.correct, 0);
    return {
      practicedDays: practiced.length,
      completedDays: completed.length,
      totalAnswered,
      accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    };
  }, [results]);

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
          <strong>{ready && summary.totalAnswered ? `${summary.accuracy}%` : "—"}</strong>
          <small>{summary.totalAnswered ? "按已答题计算" : "完成训练后生成"}</small>
        </article>
      </div>

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
