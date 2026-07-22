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
  "20260716": "图书教育：让学习安排更可执行",
  "20260717": "图书教育：让学习安排更可执行",
  "20260718": "美妆个护：让效果先被看见",
  "20260719": "美妆个护：让效果先被看见",
  "20260720": "家居日用：让问题解决过程可见",
  "20260721": "食品饮料：先制造食欲，再解释价值",
  "20260722": "滋补保健：先讲处境，再补信任",
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

type NormalizedPage = {
  lines: string[];
  urls: string[];
};

type AnalysisSection = {
  label: string;
  tone: "hook" | "story" | "feeling" | "marketing" | "comment" | "detail";
  text: string;
};

const METRIC_LABELS = [
  ["本视频销量", "销量"],
  ["本视频成交额", "成交额"],
  ["本视频结算金额", "结算金额"],
  ["达人粉丝量", "达人粉丝"],
  ["播放量", "播放量"],
  ["点赞数", "点赞数"],
  ["点赞量", "点赞数"],
] as const;

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

function normalizePageContent(text: string): NormalizedPage {
  const normalized = text
    .replace(/\r/g, "")
    .replace(/https?\s*:\s*\/\s*\/\s*w{2,3}\.\s*douyin\.\s*com\s*\/?\s*video\s*\/\s*/gi, "https://www.douyin.com/video/");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/https:\/\/www\.douyin\.com\/video\/(\d{8,19})/i);
    if (!match || match[1].length >= 18) continue;

    const next = lines[index + 1]?.match(/^\d{7,10}$/)?.[0];
    const previous = lines[index - 1]?.match(/^\d{7,10}$/)?.[0];
    const continuation = next ?? previous;
    if (!continuation) continue;

    const repaired = `https://www.douyin.com/video/${match[1]}${continuation}`;
    lines[index] = lines[index].replace(match[0], repaired);
    if (next) lines[index + 1] = "";
    if (!next && previous) lines[index - 1] = "";
  }

  const compactLines = lines.filter(Boolean);
  const urls = Array.from(
    new Set(
      compactLines.flatMap((line) => line.match(/https?:\/\/[^\s]+/g) ?? []),
    ),
  );

  return { lines: compactLines, urls };
}

function isBoilerplate(line: string, date: string) {
  return (
    line === date ||
    /^[)\]}]?[Uu]\s*哥$/.test(line) ||
    /^[Uu]\s*哥[.·\s]*每日爆品讯息$/.test(line) ||
    (line.includes("每日爆品讯息") && (line.includes(date) || /第\s*\d+\s*[\/]\s*\d+\s*页/.test(line))) ||
    /^微信里打不开/.test(line) ||
    /^扫码看原视频$/.test(line) ||
    /^直接在抖音看$/.test(line) ||
    /^https?:\/\//.test(line)
  );
}

function metricLabel(line: string) {
  return METRIC_LABELS.find(([source]) => line.includes(source))?.[1] ?? null;
}

function isMetricValue(line: string) {
  return /^(?:[¥￥]?\s*)?\d[\d,.]*(?:万|千|件|元|亿)?(?:\s*-\s*\d[\d,.]*(?:万|千|件|元|亿)?)?$/.test(line);
}

function sectionMatch(line: string): { label: string; tone: AnalysisSection["tone"]; rest: string } | null {
  const cleaned = line.replace(/^[§~【(。,，、|·\s]+/, "").replace(/^明(?=故事)/, "");
  const labels: Array<[string, AnalysisSection["tone"]]> = [
    ["先看点", "hook"],
    ["钩子", "hook"],
    ["故事", "story"],
    ["感受", "feeling"],
    ["营销", "marketing"],
    ["点评", "comment"],
    ["点睛", "comment"],
    ["拆解", "detail"],
  ];

  for (const [label, tone] of labels) {
    const position = cleaned.indexOf(label);
    if (position < 0 || position > 2) continue;
    return {
      label,
      tone,
      rest: cleaned.slice(position + label.length).replace(/^[」】\]:：\s]+/, "").trim(),
    };
  }
  return null;
}

function joinOcrLines(lines: string[]) {
  return lines.join("").replace(/·+$/, "").trim();
}

function parseSections(lines: string[]): AnalysisSection[] {
  const sections: Array<{ label: string; tone: AnalysisSection["tone"]; lines: string[] }> = [];
  let current: { label: string; tone: AnalysisSection["tone"]; lines: string[] } | null = null;

  for (const line of lines) {
    const match = sectionMatch(line);
    if (match) {
      if (current) sections.push(current);
      current = { label: match.label, tone: match.tone, lines: match.rest ? [match.rest] : [] };
      continue;
    }

    if (!current) current = { label: "正文", tone: "detail", lines: [] };
    current.lines.push(line);
  }
  if (current) sections.push(current);

  return sections
    .map((section) => ({ ...section, text: joinOcrLines(section.lines) }))
    .filter((section) => section.text || section.label === "拆解");
}

function SourceLinks({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <div className="source-links">
      <span>原视频</span>
      {urls.map((url, index) => (
        <a href={url} key={url} target="_blank" rel="noreferrer">
          <b aria-hidden="true">▶</b>
          {urls.length > 1 ? `打开链接 ${index + 1}` : "直接打开抖音"}
          <i aria-hidden="true">↗</i>
        </a>
      ))}
    </div>
  );
}

function CasePageContent({ page, date, normalized }: { page: TextPage; date: string; normalized: NormalizedPage }) {
  const lines = normalized.lines.filter((line) => !isBoilerplate(line, date));
  const publishedIndex = lines.findIndex((line) => /^\d{2}\/\d{2}$/.test(line));
  const creator = publishedIndex > 0 ? lines[publishedIndex - 1] : lines[0] ?? "本页案例";
  const published = publishedIndex >= 0 ? lines[publishedIndex] : null;
  const contentStart = publishedIndex >= 0 ? publishedIndex + 1 : Math.min(1, lines.length);
  const analysisIndex = lines.findIndex((line, index) => index >= contentStart && sectionMatch(line));
  const preAnalysis = lines.slice(contentStart, analysisIndex >= 0 ? analysisIndex : lines.length);
  const metricStart = preAnalysis.findIndex((line) => metricLabel(line) || isMetricValue(line));
  const titleLines = preAnalysis.slice(0, metricStart >= 0 ? metricStart : Math.min(3, preAnalysis.length));
  const dataLines = preAnalysis.slice(metricStart >= 0 ? metricStart : titleLines.length);
  const labels = dataLines.map(metricLabel).filter((label) => label !== null);
  const values = dataLines.filter(isMetricValue);
  const metrics = labels.slice(0, values.length).map((label, index) => ({ label, value: values[index] }));
  const context = joinOcrLines(
    dataLines.filter((line) => !metricLabel(line) && !isMetricValue(line) && /[一-鿿]{3}/.test(line)),
  );
  const sections = parseSections(lines.slice(analysisIndex >= 0 ? analysisIndex : lines.length));
  const title = joinOcrLines(titleLines) || "本页案例";

  return (
    <div className="case-page-content">
      <header className="case-header">
        <div className="case-byline">
          <span>达人</span>
          <strong>{creator}</strong>
          {published ? <time>{published}</time> : null}
        </div>
        <h3>{title}</h3>
        {context ? (
          <details className="case-context">
            <summary>图片文字补充（OCR）</summary>
            <p>{context}</p>
          </details>
        ) : null}
      </header>

      {metrics.length ? (
        <div className="metric-grid" aria-label="本页数据概览">
          {metrics.map((metric, index) => (
            <div className="metric-card" key={`${metric.label}-${index}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {sections.length ? (
        <div className="analysis-grid">
          {sections.map((section, index) => (
            section.label === "拆解" && !section.text ? (
              <div className="analysis-divider" key={`${section.label}-${index}`}>
                <span>拆解分析</span>
                <i />
              </div>
            ) : (
              <section className={`analysis-section ${section.tone}`} key={`${section.label}-${index}`}>
                <h4>{section.label}</h4>
                <p>{section.text}</p>
              </section>
            )
          ))}
        </div>
      ) : null}

      <SourceLinks urls={normalized.urls} />
      <p className="ocr-note">本页文字由 PDF OCR 结构化整理，个别图片文字可能存在识别误差。</p>
    </div>
  );
}

function isIntroEntry(line: string) {
  return /^(?:第\d+张|[🏆🔥⭐]|销冠样本|流量炸|低粉爆发|场景痛点|特别案例)/.test(line);
}

function IntroPageContent({ date, normalized }: { date: string; normalized: NormalizedPage }) {
  const lines = normalized.lines.filter((line) => !isBoilerplate(line, date) && !/^·$/.test(line));
  const headingIndex = lines.findIndex((line) => /导读|爆品采集/.test(line));
  const heading = headingIndex >= 0 ? lines[headingIndex] : "今日导读";
  const body = lines.slice(headingIndex >= 0 ? headingIndex + 1 : 0);
  const takeawayMarker = body.findIndex((line) => line.includes("今天最该记住的一句话"));
  const takeaway = takeawayMarker >= 0 ? body[takeawayMarker + 1] : null;
  const filteredBody = body.filter((_, index) => {
    const isTakeawayLine = takeawayMarker >= 0 && (index === takeawayMarker || index === takeawayMarker + 1);
    return !isTakeawayLine && !/^#\d+$/.test(body[index]);
  });
  const overview: string[] = [];
  const entries: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of filteredBody) {
    if (isIntroEntry(line)) {
      if (current) entries.push(current);
      current = { title: line.replace(/·+$/, ""), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      overview.push(line);
    }
  }
  if (current) entries.push(current);

  const principles = overview.filter((line) => /^(?:先看|再看|最后看|[🏆🔥⭐]|今日.*重点|今天要学什么|一句话规律)/.test(line));
  const lead = overview.filter((line) => !principles.includes(line));

  return (
    <div className="intro-page-content">
      <header className="brief-header">
        <span>本期导读</span>
        <h3>{heading}</h3>
        {lead.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
      </header>

      {principles.length ? (
        <div className="brief-principles">
          {principles.map((line, index) => <span key={`${line}-${index}`}>{line.replace(/^###\s*/, "")}</span>)}
        </div>
      ) : null}

      {takeaway ? (
        <blockquote className="brief-takeaway">
          <span>今天最该记住</span>
          <p>{takeaway}</p>
        </blockquote>
      ) : null}

      {entries.length ? (
        <div className="brief-cards">
          {entries.map((entry, index) => (
            <article className="brief-card" key={`${entry.title}-${index}`}>
              <span className="brief-card-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{entry.title}</h4>
                {entry.lines.map((line, lineIndex) => {
                  const [label, ...rest] = line.split(/[:：]/);
                  const isMeta = ["达人", "数据", "先看点", "学习点"].includes(label);
                  return isMeta ? (
                    <p className={`brief-card-${label === "先看点" || label === "学习点" ? "focus" : "meta"}`} key={`${line}-${lineIndex}`}>
                      <strong>{label}</strong>
                      <span>{rest.join(":")}</span>
                    </p>
                  ) : <p key={`${line}-${lineIndex}`}>{line}</p>;
                })}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <SourceLinks urls={normalized.urls} />
    </div>
  );
}

function StructuredPageContent({ page, date }: { page: TextPage; date: string }) {
  const normalized = normalizePageContent(page.text);
  const isIntro = page.number === 1 && normalized.lines.some((line) => /导读|爆品采集|本期可复用/.test(line));
  return isIntro
    ? <IntroPageContent date={date} normalized={normalized} />
    : <CasePageContent page={page} date={date} normalized={normalized} />;
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
                <StructuredPageContent page={page} date={date} />
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
