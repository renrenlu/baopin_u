import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const vaultRoot =
  process.env.BAOPIN_OBSIDIAN_VAULT ??
  "/Users/mt/Library/Mobile Documents/iCloud~md~obsidian/Documents/baokuan_dhsp";
const sourceDir = path.join(vaultRoot, "06-素材库");
const dryRun = process.argv.includes("--dry-run");
const minimumFileAgeMs = Number(process.env.BAOPIN_MIN_FILE_AGE_MS ?? 120_000);

const homePath = path.join(projectRoot, "app/page.tsx");
const readerPath = path.join(projectRoot, "app/issues/[date]/page.tsx");
const pdfDir = path.join(projectRoot, "public/pdfs");
const textDir = path.join(projectRoot, "content/issues");

function fail(message) {
  console.error(JSON.stringify({ status: "error", message }, null, 2));
  process.exit(1);
}

function cleanText(value) {
  return value
    .replace(/<!--.*?-->/gs, "")
    .replace(/!\[\[.*?\]\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。！？；：])/g, "$1")
    .trim();
}

function sectionParagraph(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return "";

  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^##\s+/.test(line)) break;
    if (!line || line.startsWith("![[") || line.startsWith("<!--")) {
      if (body.length) break;
      continue;
    }
    body.push(line.replace(/^[-*]\s+/, ""));
  }
  return cleanText(body.join(" "));
}

function shortTopic(value) {
  const cleaned = cleanText(value)
    .replace(/^【.*?】/, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[·|]/g, " ")
    .trim();
  const namedTopics = [
    [/初升高|预备新高一/, "初升高暑假预习"],
    [/百科全书/, "课本里的百科全书"],
    [/初中.*字帖|字帖.*初中/, "初中字帖"],
    [/高中.*字帖|字帖.*高中/, "高中字帖"],
    [/眼线/, "眼线产品"],
    [/粉扑/, "粉扑"],
    [/坚果/, "坚果"],
    [/燕窝/, "燕窝"],
    [/阿胶/, "阿胶"],
  ];
  const named = namedTopics.find(([pattern]) => pattern.test(cleaned));
  if (named) return named[1];
  return cleaned.length > 16 ? `${cleaned.slice(0, 15)}…` : cleaned;
}

function extractTopics(guide) {
  const topics = [];
  for (const match of guide.matchAll(/^- 产品：\[\[([^\]]+)\]\]/gm)) {
    const label = match[1].split("|").at(-1) ?? "";
    const topic = shortTopic(label);
    if (topic && !topics.includes(topic)) topics.push(topic);
    if (topics.length === 3) break;
  }
  return topics.length ? topics : ["当日爆品", "内容拆解", "成交案例"];
}

function classify(summary, takeaway, topics) {
  const text = `${summary} ${takeaway} ${topics.join(" ")}`;
  const rules = [
    {
      test: /图书|教辅|教育|学习|年级|家长|字帖|语文|数学|英语|启蒙/,
      category: "图书教育",
      title: "图书教育：让学习安排更可执行",
      accent: "blue",
    },
    {
      test: /美妆|口红|唇|眼线|粉扑|底妆|护肤|面膜/,
      category: "美妆个护",
      title: "美妆个护：让效果先被看见",
      accent: "peach",
    },
    {
      test: /食品|饮料|坚果|奶|粥|茶|食养|零食|口感|配料/,
      category: "食品饮料",
      title: "食品饮料：先制造食欲，再解释价值",
      accent: "lime",
    },
    {
      test: /母婴|宝宝|儿童|孕|育儿/,
      category: "母婴用品",
      title: "母婴用品：先回应担心，再建立信任",
      accent: "peach",
    },
    {
      test: /滋补|保健|养生|营养|辅酶|阿胶|燕窝/,
      category: "滋补保健",
      title: "滋补保健：先讲处境，再补信任",
      accent: "lime",
    },
    {
      test: /家居|清洁|收纳|日用|厨房|出行/,
      category: "家居日用",
      title: "家居日用：让问题解决过程可见",
      accent: "lavender",
    },
  ];
  return (
    rules.find((rule) => rule.test.test(text)) ?? {
      category: "综合选品",
      title: "综合选品：从真实场景找到成交理由",
      accent: "lavender",
    }
  );
}

function issueLiteral(issue) {
  const quote = (value) => JSON.stringify(value);
  return [
    "  {",
    `    date: ${quote(issue.date)},`,
    `    title: ${quote(issue.title)},`,
    `    summary: ${quote(issue.summary)},`,
    `    takeaway: ${quote(issue.takeaway)},`,
    `    category: ${quote(issue.category)},`,
    `    topics: ${JSON.stringify(issue.topics)},`,
    `    size: ${quote(issue.size)},`,
    `    accent: ${quote(issue.accent)},`,
    "  },",
  ].join("\n");
}

if (!existsSync(sourceDir)) fail(`Obsidian PDF 目录不存在：${sourceDir}`);
if (!existsSync(homePath) || !existsSync(readerPath)) fail("网站期刊页面文件不存在");

const candidates = new Map();
for (const filename of readdirSync(sourceDir)) {
  if (!filename.toLowerCase().endsWith(".pdf") || !filename.includes("每日爆品讯息")) continue;
  const date = filename.match(/(20\d{6})/)?.[1];
  if (!date) continue;
  const pdfPath = path.join(sourceDir, filename);
  const stats = statSync(pdfPath);
  const previous = candidates.get(date);
  if (!previous || stats.mtimeMs > previous.mtimeMs) {
    candidates.set(date, { date, filename, pdfPath, mtimeMs: stats.mtimeMs, size: stats.size });
  }
}

let homeSource = readFileSync(homePath, "utf8");
let readerSource = readFileSync(readerPath, "utf8");
const added = [];
const pending = [];
const skipped = [];

for (const candidate of [...candidates.values()].sort((a, b) => a.date.localeCompare(b.date))) {
  const compactDate = candidate.date;
  const isoDate = `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
  const targetPdf = path.join(pdfDir, `${compactDate}.pdf`);
  const targetText = path.join(textDir, `${compactDate}.md`);
  const hasHomeEntry = homeSource.includes(`date: "${isoDate}"`);
  const hasReaderEntry = readerSource.includes(`"${compactDate}":`);

  if (existsSync(targetPdf) && existsSync(targetText) && hasHomeEntry && hasReaderEntry) {
    skipped.push(compactDate);
    continue;
  }

  if (Date.now() - candidate.mtimeMs < minimumFileAgeMs) {
    pending.push({ date: compactDate, reason: "PDF 仍在同步，等待文件稳定" });
    continue;
  }

  const baseName = candidate.filename.replace(/\.pdf$/i, "");
  const extractedText = path.join(sourceDir, `${baseName}-文字提取.md`);
  const monthFolder = `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}`;
  const guidePath = path.join(vaultRoot, "10-当日导读", monthFolder, `${compactDate}.md`);
  if (!existsSync(extractedText) || !existsSync(guidePath)) {
    pending.push({
      date: compactDate,
      reason: "等待 Obsidian 完成文字提取和当日导读",
      missing: [extractedText, guidePath].filter((file) => !existsSync(file)),
    });
    continue;
  }

  const guide = readFileSync(guidePath, "utf8");
  const summary = sectionParagraph(guide, "今日导读");
  const takeaway = sectionParagraph(guide, "今天最该记住的一句话");
  if (!summary || !takeaway) {
    pending.push({ date: compactDate, reason: "当日导读缺少摘要或一句话重点" });
    continue;
  }

  const topics = extractTopics(guide);
  const classification = classify(summary, takeaway, topics);
  const issue = {
    date: isoDate,
    title: classification.title,
    summary,
    takeaway,
    category: classification.category,
    topics,
    size: `${(candidate.size / 1024 / 1024).toFixed(1)} MB`,
    accent: classification.accent,
  };

  if (!hasHomeEntry) {
    const marker = "\n];\n\nconst MONTHS";
    if (!homeSource.includes(marker)) fail("无法定位首页期刊列表插入点");
    homeSource = homeSource.replace(marker, `\n${issueLiteral(issue)}\n];\n\nconst MONTHS`);
  }
  if (!hasReaderEntry) {
    const marker = "\n};\n\nconst ISSUE_DATES";
    if (!readerSource.includes(marker)) fail("无法定位文字版标题列表插入点");
    readerSource = readerSource.replace(
      marker,
      `\n  ${JSON.stringify(compactDate)}: ${JSON.stringify(issue.title)},\n};\n\nconst ISSUE_DATES`,
    );
  }

  if (!dryRun) {
    mkdirSync(pdfDir, { recursive: true });
    mkdirSync(textDir, { recursive: true });
    if (!existsSync(targetPdf)) copyFileSync(candidate.pdfPath, targetPdf);
    if (!existsSync(targetText)) copyFileSync(extractedText, targetText);
  }
  added.push({ date: compactDate, source: candidate.filename, ...issue });
}

if (!dryRun && added.length) {
  writeFileSync(homePath, homeSource);
  writeFileSync(readerPath, readerSource);
}

console.log(
  JSON.stringify(
    {
      status: added.length ? (dryRun ? "dry-run" : "updated") : pending.length ? "pending" : "unchanged",
      sourceDir,
      added,
      pending,
      skippedCount: skipped.length,
    },
    null,
    2,
  ),
);
