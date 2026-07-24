import type { Metadata } from "next";
import trainingData from "@/data/hook-training.json";
import HookHeader from "./hook-header";
import TrainingHistory from "./training-history";
import { getTrainingIssueTitle } from "./training-title";

type TrainingIssue = (typeof trainingData.issues)[number];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const issues = [...trainingData.issues].sort((a, b) => b.date.localeCompare(a.date));

export const metadata: Metadata = {
  title: "钩子训练｜每日爆品讯息",
  description: "按日期归档的爆款钩子训练。先独立判断，再逐题查看参考答案。",
};

function issueHref(issue: TrainingIssue) {
  return `${BASE_PATH}/hooks/${issue.date.replaceAll("-", "")}/`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export default function HookArchivePage() {
  const latest = issues[0];
  const [yearText, monthText] = latest.date.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const issueByDay = new Map(
    issues
      .filter((issue) => issue.date.startsWith(`${yearText}-${monthText}`))
      .map((issue) => [Number(issue.date.slice(-2)), issue]),
  );
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );

  return (
    <main className="hook-shell" id="top">
      <HookHeader />

      <section className="hook-archive-page">
        <header className="hook-archive-hero">
          <div>
            <span>HOOK PRACTICE · 按日期训练</span>
            <h1>钩子训练</h1>
          </div>
          <p>先凭第一眼做判断，再自己展开答案。<br />每次只练一个动作：识别更有传播力的开头。</p>
        </header>

        <TrainingHistory
          basePath={BASE_PATH}
          issues={issues.map((issue) => ({
            date: issue.date,
            title: getTrainingIssueTitle(issue),
            questions: issue.questions.map((question) => ({
              id: question.id,
              correct: question.correct,
            })),
          }))}
        />

        <div className="hook-archive-layout">
          <aside className="hook-calendar-card" aria-label={`${year} 年 ${month} 月训练日历`}>
            <div className="hook-calendar-heading">
              <span>训练日历</span>
              <strong>{year} 年 {month} 月</strong>
            </div>
            <div className="hook-weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="hook-calendar-grid">
              {calendarCells.map((day, index) => {
                if (day === null) return <span key={`empty-${index}`} />;
                const issue = issueByDay.get(day);
                return issue ? (
                  <a href={issueHref(issue)} key={day} aria-label={`进入 ${formatDate(issue.date)}钩子训练`}>
                    {day}<i aria-hidden="true" />
                  </a>
                ) : <span className="empty-day" key={day}>{day}</span>;
              })}
            </div>
            <p>从 2026 年 7 月 22 日开始归档</p>
          </aside>

          <section className="hook-issue-list" aria-labelledby="hook-issue-heading">
            <div className="hook-list-heading">
              <div>
                <span>DATE ARCHIVE</span>
                <h2 id="hook-issue-heading">全部训练</h2>
              </div>
              <strong>{issues.length} 期</strong>
            </div>

            {issues.map((issue, index) => (
              <article className="hook-issue-card" key={issue.date}>
                <div className="hook-issue-date">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <time dateTime={issue.date}>{formatDate(issue.date)}</time>
                </div>
                <h2><a href={issueHref(issue)}>{getTrainingIssueTitle(issue)}<span aria-hidden="true">↗</span></a></h2>
                <p>{issue.description}</p>
                <footer>
                  <span>{issue.questions.length} 道题</span>
                  <span>答案逐题展开</span>
                  <a href={issueHref(issue)}>开始答题 →</a>
                </footer>
              </article>
            ))}
          </section>
        </div>

        <footer className="site-footer gallery-footer">
          <p>钩子训练 <span>·</span> 先判断，再看答案</p>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </section>
    </main>
  );
}
