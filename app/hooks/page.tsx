import type { Metadata } from "next";
import trainingData from "@/data/hook-training.json";
import HookCalendar from "./hook-calendar";
import HookHeader from "./hook-header";
import TrainingHistory from "./training-history";
import { getTrainingIssueTitle } from "./training-title";

type TrainingIssue = (typeof trainingData.issues)[number];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
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
  return (
    <main className="hook-shell" id="top">
      <HookHeader />

      <section className="hook-archive-page">
        <header className="hook-archive-hero">
          <div>
            <span>HOOK PRACTICE · 按日期训练</span>
            <h1>钩子训练</h1>
          </div>
          <div className="hook-archive-intro">
            <p>先凭第一眼做判断，再自己展开答案。<br />每次只练一个动作：识别更有传播力的开头。</p>
            <a href={`${BASE_PATH}/hook-games/`}>进入钩子游戏 →</a>
          </div>
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
          <HookCalendar basePath={BASE_PATH} issues={issues.map((issue) => ({ date: issue.date }))} />

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
