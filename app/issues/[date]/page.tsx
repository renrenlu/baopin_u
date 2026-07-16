import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

const ISSUE_TITLES: Record<string, string> = {
  "20260625": "日常好物与养生食品观察",
  "20260626": "母婴个护：驱蚊与儿童护理",
  "20260627": "个人护理爆品：痛点先行",
  "20260628": "美妆爆品：让效果先被看见",
  "20260629": "夏日出行与家居清凉好物",
  "20260630": "食饮滋补：日常场景里的成交",
  "20260701": "养生轻饮：自律也要有场景",
  "20260702": "暑期内容：教辅与亲子沟通",
  "20260703": "母婴日用：低门槛的育儿安心感",
  "20260704": "个护爆品：把痛感讲具体",
  "20260705": "美妆测评：信任由验证产生",
  "20260706": "家居小物：从省事到情绪价值",
  "20260707": "食品饮料：先让用户想吃",
  "20260708": "滋补保健：先停留，再成交",
  "20260709": "教辅启蒙：把学习焦虑变行动",
  "20260710": "宠物与青少年护理的直观证据",
  "20260711": "家居清洁：让结果成为钩子",
  "20260712": "美妆工具：变化比参数更有力",
  "20260713": "家居日用：先看见问题被解决",
  "20260714": "食品饮料：先想吃，再解释",
  "20260715": "滋补保健：先讲处境，再补信任",
};

const ISSUE_DATES = Object.keys(ISSUE_TITLES);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type IssuePageProps = {
  params: Promise<{ date: string }>;
};

type TextPage = {
  number: number;
  text: string;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return ISSUE_DATES.map((date) => ({ date }));
}

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const { date } = await params;
  const title = ISSUE_TITLES[date];
  return title
    ? {
        title: `${title}｜每日爆品讯息文字版`,
        description: `${formatDate(date)}期 PDF 完整文字提取版。`,
      }
    : {};
}

function formatDate(date: string) {
  return `${date.slice(0, 4)} 年 ${Number(date.slice(4, 6))} 月 ${Number(date.slice(6, 8))} 日`;
}

function loadTextPages(date: string): TextPage[] | null {
  const filePath = path.join(process.cwd(), "content", "issues", `${date}.md`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf8")
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/^# .*?\n+/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const parts = raw.split(/^## 第 (\d+) 页\s*$/gm);
  const pages: TextPage[] = [];

  for (let index = 1; index < parts.length; index += 2) {
    pages.push({
      number: Number(parts[index]),
      text: parts[index + 1]?.trim() ?? "",
    });
  }

  return pages;
}

export default async function IssueTextPage({ params }: IssuePageProps) {
  const { date } = await params;
  const title = ISSUE_TITLES[date];
  const pages = loadTextPages(date);

  if (!title || !pages) notFound();

  const pdfHref = `${BASE_PATH}/pdfs/${date}.pdf`;
  const archiveHref = `${BASE_PATH}/#archive`;

  return (
    <main className="reader-shell" id="reader-top">
      <header className="reader-topbar">
        <a className="reader-brand" href={`${BASE_PATH}/`} aria-label="返回每日爆品讯息首页">
          <span className="brand-mark" aria-hidden="true">爆</span>
          <span>
            <strong>每日爆品讯息</strong>
            <small>FULL TEXT ARCHIVE</small>
          </span>
        </a>
        <a className="reader-back" href={archiveHref}>← 返回本月归档</a>
      </header>

      <div className="reader-layout">
        <aside className="reader-toc" aria-label="文字版页码导航">
          <div className="reader-toc-heading">
            <span>全文目录</span>
            <strong>{pages.length} 页</strong>
          </div>
          <nav>
            {pages.map((page) => (
              <a href={`#page-${page.number}`} key={page.number}>{String(page.number).padStart(2, "0")}</a>
            ))}
          </nav>
          <p>文字由 PDF OCR 提取，可能存在少量识别误差。</p>
        </aside>

        <article className="reader-article">
          <header className="reader-hero">
            <div className="reader-kicker">
              <span>{date} 期</span>
              <i />
              <span>PDF 完整文字版</span>
            </div>
            <h1>{title}</h1>
            <p>共 {pages.length} 页 · 已按原 PDF 页码保留全部提取文字，方便搜索、复制和连续阅读。</p>
            <div className="reader-actions">
              <a className="reader-primary" href={pdfHref} target="_blank" rel="noreferrer">打开原 PDF ↗</a>
              <a className="reader-secondary" href={pdfHref} download>↓ 下载 PDF</a>
            </div>
          </header>

          <div className="reader-pages">
            {pages.map((page) => (
              <section className="text-page" id={`page-${page.number}`} key={page.number}>
                <div className="text-page-heading">
                  <span>PAGE</span>
                  <h2>第 {page.number} 页</h2>
                  <a href="#reader-top" aria-label="返回文字版顶部">↑</a>
                </div>
                <pre>{page.text}</pre>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
