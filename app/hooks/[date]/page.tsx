import type { Metadata } from "next";
import { notFound } from "next/navigation";
import trainingData from "@/data/hook-training.json";
import HookHeader from "../hook-header";
import TrainingSession from "./training-session";

type TrainingPageProps = {
  params: Promise<{ date: string }>;
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamicParams = false;

export function generateStaticParams() {
  return trainingData.issues.map((issue) => ({ date: issue.date.replaceAll("-", "") }));
}

function findIssue(date: string) {
  return trainingData.issues.find((issue) => issue.date.replaceAll("-", "") === date);
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export async function generateMetadata({ params }: TrainingPageProps): Promise<Metadata> {
  const { date } = await params;
  const issue = findIssue(date);
  return issue
    ? {
        title: `${formatDate(issue.date)}钩子训练｜每日爆品讯息`,
        description: issue.description,
      }
    : {};
}

export default async function TrainingPage({ params }: TrainingPageProps) {
  const { date } = await params;
  const issue = findIssue(date);
  if (!issue) notFound();

  return (
    <main className="hook-shell" id="top">
      <HookHeader />
      <article className="hook-training-page">
        <header className="hook-training-hero">
          <a className="gallery-breadcrumb" href={`${BASE_PATH}/hooks/`}>← 返回钩子训练日期归档</a>
          <div className="hook-training-meta">
            <time dateTime={issue.date}>{formatDate(issue.date)}</time>
            <span>{issue.questions.length} 道题</span>
            <span>答案可自行展开</span>
          </div>
          <h1>{issue.title}</h1>
          <p>{issue.description}</p>
          <div className="hook-hero-actions">
            <a href="#question-1">开始答题 ↓</a>
            <a href={`${BASE_PATH}${issue.pdf}`} target="_blank" rel="noreferrer">打开 PDF 版 ↗</a>
            <a href={`${BASE_PATH}${issue.pdf}`} download>下载 PDF</a>
          </div>
        </header>

        <TrainingSession issue={issue} basePath={BASE_PATH} />

        <footer className="site-footer gallery-footer">
          <p>钩子训练 <span>·</span> 你的选择只保存在当前浏览器</p>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </article>
    </main>
  );
}
