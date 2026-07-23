import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const projectRoot = process.cwd();
const vaultRoot =
  process.env.BAOPIN_OBSIDIAN_VAULT ??
  "/Users/mt/Library/Mobile Documents/iCloud~md~obsidian/Documents/baokuan_dhsp";
const sourceDir = path.join(vaultRoot, "06-素材库");
const galleryVaultRoot =
  process.env.BAOPIN_GALLERY_VAULT ??
  "/Users/mt/Library/Mobile Documents/iCloud~md~obsidian/Documents/photo_u";
const dryRun = process.argv.includes("--dry-run");
const minimumFileAgeMs = Number(process.env.BAOPIN_MIN_FILE_AGE_MS ?? 120_000);

const homePath = path.join(projectRoot, "app/page.tsx");
const readerPath = path.join(projectRoot, "app/issues/[date]/page.tsx");
const pdfDir = path.join(projectRoot, "public/pdfs");
const textDir = path.join(projectRoot, "content/issues");
const galleryPublicDir = path.join(projectRoot, "public/galleries");
const galleryManifestPath = path.join(projectRoot, "data/galleries.json");
const galleryTextDir = path.join(projectRoot, "content/galleries");
const hookVaultDir = path.join(vaultRoot, "07-钩子");
const hookManifestPath = path.join(projectRoot, "data/hook-training.json");
const hookPublicDir = path.join(projectRoot, "public/hooks");
const hookExtractorPath = path.join(projectRoot, "scripts/extract-hook-training.py");
const hookPython =
  process.env.BAOPIN_PDF_PYTHON ??
  "/Users/mt/Library/Application Support/U哥PDF工作流/.venv/bin/python";

const GALLERY_SOURCES = [
  {
    slug: "social",
    label: "社会热点",
    directories: ["03热点选题拆解", "03社会热点"],
    description: "从正在发生的事件里，提炼立场、冲突与可展开的内容角度。",
  },
  {
    slug: "reading",
    label: "读书分享",
    directories: ["02读书分享"],
    description: "把书里的关键认知整理成可以快速浏览、反复回看的视觉笔记。",
  },
  {
    slug: "viral",
    label: "爆款裂变",
    directories: ["01爆款作品裂变", "01爆款裂变"],
    description: "拆出爆款内容的受众、钩子与结构，沉淀成可复用的创作模板。",
  },
];

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

function galleryTitle(markdown, fallback) {
  return cleanText(markdown.match(/^#\s+(.+)$/m)?.[1] ?? fallback);
}

function galleryCollected(markdown, stats) {
  const frontmatterDate = markdown.match(/^collected:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  if (frontmatterDate) return frontmatterDate;
  return new Date(stats.mtimeMs).toISOString().slice(0, 10);
}

function galleryPlainText(markdown) {
  return cleanText(
    markdown
      .replace(/^---[\s\S]*?---\s*/m, "")
      .replace(/!\[\[.*?\]\]/g, "")
      .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*>]\s*/gm, "")
      .replace(/[*_`~]/g, ""),
  );
}

function galleryExcerpt(markdown) {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/m, "");
  const lines = withoutFrontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("#") &&
        !line.startsWith("原图：") &&
        !line.startsWith("![[") &&
        !line.startsWith(">") &&
        !line.startsWith("-") &&
        !/^\d+\./.test(line),
    );
  const cleanedLines = lines.map(galleryPlainText).filter(Boolean);
  const excerpt = cleanedLines.find((line) => line.length >= 28) ?? cleanedLines[0] ?? "";
  return excerpt.length > 110 ? `${excerpt.slice(0, 109)}…` : excerpt;
}

function gallerySlug(category, baseName) {
  return `${category}-${createHash("sha1").update(baseName).digest("hex").slice(0, 10)}`;
}

function galleryMarkdownCopy(markdown) {
  return `${markdown.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd()}\n`;
}

function createThumbnail(source, target) {
  mkdirSync(path.dirname(target), { recursive: true });
  execFileSync(
    "sips",
    ["--resampleWidth", "900", "-s", "format", "public.jpeg", "-s", "formatOptions", "78", source, "--out", target],
    { stdio: "ignore" },
  );
}

function syncGalleries() {
  const addedImages = [];
  const updatedTexts = [];
  const galleryPending = [];
  const galleries = [];
  const previousManifest = existsSync(galleryManifestPath) ? readFileSync(galleryManifestPath, "utf8") : "";
  let previousGalleries = [];
  try {
    previousGalleries = previousManifest ? JSON.parse(previousManifest) : [];
  } catch {
    previousGalleries = [];
  }

  if (!existsSync(galleryVaultRoot)) {
    return {
      changed: false,
      addedImages,
      pending: [{ area: "gallery", reason: `Obsidian 图片库不存在：${galleryVaultRoot}` }],
      total: 0,
    };
  }

  for (const source of GALLERY_SOURCES) {
    const directory = source.directories.find((name) => existsSync(path.join(galleryVaultRoot, name)));
    const items = [];

    if (!directory) {
      galleryPending.push({ area: source.label, reason: `找不到栏目目录：${source.directories.join(" 或 ")}` });
      galleries.push(
        previousGalleries.find((gallery) => gallery.slug === source.slug) ?? {
          slug: source.slug,
          label: source.label,
          description: source.description,
          items,
        },
      );
      continue;
    }

    const categoryRoot = path.join(galleryVaultRoot, directory);
    const imageDir = path.join(categoryRoot, `${directory}_图片收集`);
    const titleDir = path.join(categoryRoot, `${directory}_标题`);
    if (!existsSync(imageDir)) {
      galleryPending.push({ area: source.label, reason: `图片目录不存在：${imageDir}` });
      galleries.push(
        previousGalleries.find((gallery) => gallery.slug === source.slug) ?? {
          slug: source.slug,
          label: source.label,
          description: source.description,
          items,
        },
      );
      continue;
    }

    const filenames = readdirSync(imageDir)
      .filter((filename) => /\.(?:png|jpe?g|webp)$/i.test(filename))
      .sort((a, b) => a.localeCompare(b, "zh-CN"));

    for (const filename of filenames) {
      const imageSource = path.join(imageDir, filename);
      const stats = statSync(imageSource);
      if (Date.now() - stats.mtimeMs < minimumFileAgeMs) {
        galleryPending.push({ area: source.label, file: filename, reason: "图片仍在同步，等待文件稳定" });
        continue;
      }

      const baseName = filename.replace(/\.[^.]+$/, "");
      const titlePath = path.join(titleDir, `${baseName}.md`);
      const markdown = existsSync(titlePath) ? readFileSync(titlePath, "utf8") : "";
      const websiteMarkdown = markdown ? galleryMarkdownCopy(markdown) : "";
      const slug = gallerySlug(source.slug, baseName);
      const textTarget = path.join(galleryTextDir, source.slug, `${slug}.md`);
      const originalTarget = path.join(galleryPublicDir, source.slug, "original", filename);
      const thumbnailFilename = `${baseName}.jpg`;
      const thumbnailTarget = path.join(galleryPublicDir, source.slug, "thumbs", thumbnailFilename);
      let thumbnail = `/galleries/${source.slug}/thumbs/${thumbnailFilename}`;

      if (!dryRun && !existsSync(originalTarget)) {
        mkdirSync(path.dirname(originalTarget), { recursive: true });
        copyFileSync(imageSource, originalTarget);
        addedImages.push({ category: source.label, title: baseName, file: filename });
      } else if (dryRun && !existsSync(originalTarget)) {
        addedImages.push({ category: source.label, title: baseName, file: filename });
      }

      if (!dryRun && !existsSync(thumbnailTarget)) {
        try {
          createThumbnail(imageSource, thumbnailTarget);
        } catch {
          thumbnail = `/galleries/${source.slug}/original/${filename}`;
        }
      } else if (!existsSync(thumbnailTarget)) {
        thumbnail = `/galleries/${source.slug}/original/${filename}`;
      }

      if (markdown) {
        const previousText = existsSync(textTarget) ? readFileSync(textTarget, "utf8") : "";
        if (previousText !== websiteMarkdown) {
          updatedTexts.push({ category: source.label, title: galleryTitle(markdown, baseName), file: `${slug}.md` });
          if (!dryRun) {
            mkdirSync(path.dirname(textTarget), { recursive: true });
            writeFileSync(textTarget, websiteMarkdown);
          }
        }
      }

      items.push({
        slug,
        title: galleryTitle(markdown, baseName),
        collected: galleryCollected(markdown, stats),
        excerpt: galleryExcerpt(markdown),
        searchText: galleryPlainText(markdown),
        image: `/galleries/${source.slug}/original/${filename}`,
        thumbnail,
        content: markdown ? `content/galleries/${source.slug}/${slug}.md` : null,
      });
    }

    items.sort((a, b) => b.collected.localeCompare(a.collected) || a.title.localeCompare(b.title, "zh-CN"));
    galleries.push({
      slug: source.slug,
      label: source.label,
      description: source.description,
      items,
    });
  }

  const manifest = `${JSON.stringify(galleries, null, 2)}\n`;
  const manifestChanged = manifest !== previousManifest;
  if (!dryRun && manifestChanged) {
    mkdirSync(path.dirname(galleryManifestPath), { recursive: true });
    writeFileSync(galleryManifestPath, manifest);
  }

  return {
    changed: manifestChanged || addedImages.length > 0 || updatedTexts.length > 0,
    manifestChanged,
    addedImages,
    updatedTexts,
    pending: galleryPending,
    total: galleries.reduce((sum, gallery) => sum + gallery.items.length, 0),
  };
}

function recursiveFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const current = path.join(root, entry.name);
    return entry.isDirectory() ? recursiveFiles(current) : [current];
  });
}

function syncHookTraining() {
  const added = [];
  const pending = [];
  const skipped = [];
  if (!existsSync(hookVaultDir)) {
    return {
      changed: false,
      added,
      pending: [{ area: "钩子训练", reason: `Obsidian 目录不存在：${hookVaultDir}` }],
      skipped,
    };
  }
  if (!existsSync(hookExtractorPath) || !existsSync(hookPython)) {
    return {
      changed: false,
      added,
      pending: [{ area: "钩子训练", reason: "钩子训练提取器或本地 Python 不存在" }],
      skipped,
    };
  }

  const previousManifest = existsSync(hookManifestPath)
    ? readFileSync(hookManifestPath, "utf8")
    : '{"issues":[]}';
  let manifest;
  try {
    manifest = JSON.parse(previousManifest);
  } catch {
    return {
      changed: false,
      added,
      pending: [{ area: "钩子训练", reason: `清单格式错误：${hookManifestPath}` }],
      skipped,
    };
  }
  manifest.issues ??= [];
  const knownDates = new Set(manifest.issues.map((issue) => issue.date));
  const candidates = new Map();

  for (const file of recursiveFiles(hookVaultDir)) {
    const filename = path.basename(file);
    if (!/^钩子训练-.*\.pdf$/i.test(filename)) continue;
    const match = filename.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})/);
    if (!match) continue;
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const stats = statSync(file);
    const previous = candidates.get(date);
    if (!previous || stats.mtimeMs > previous.mtimeMs) {
      candidates.set(date, { date, file, filename, stats });
    }
  }

  for (const candidate of [...candidates.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    if (knownDates.has(candidate.date)) {
      skipped.push(candidate.date);
      continue;
    }
    if (Date.now() - candidate.stats.mtimeMs < minimumFileAgeMs) {
      pending.push({ area: "钩子训练", date: candidate.date, reason: "PDF 仍在同步，等待文件稳定" });
      continue;
    }

    const compactDate = candidate.date.replaceAll("-", "");
    const outputDir = path.join(hookPublicDir, compactDate);
    const publicPrefix = `/hooks/${compactDate}`;
    const args = [
      hookExtractorPath,
      "--pdf",
      candidate.file,
      "--public-prefix",
      publicPrefix,
    ];
    if (!dryRun) args.push("--output-dir", outputDir);

    try {
      const result = JSON.parse(
        execFileSync(hookPython, args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }),
      );
      if (result.status !== "ok" || !result.issue) {
        throw new Error(result.message ?? "提取器未返回训练内容");
      }
      const issue = result.issue;
      if (!dryRun) {
        mkdirSync(hookPublicDir, { recursive: true });
        copyFileSync(candidate.file, path.join(hookPublicDir, `钩子训练-${candidate.date}.pdf`));
        manifest.issues.push(issue);
        knownDates.add(candidate.date);
      }
      added.push({
        date: candidate.date,
        source: candidate.filename,
        questions: issue.questions.length,
        assets: issue.questions.reduce((sum, question) => sum + question.images.length, 0),
      });
    } catch (error) {
      pending.push({
        area: "钩子训练",
        date: candidate.date,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!dryRun && added.length) {
    manifest.issues.sort((a, b) => a.date.localeCompare(b.date));
    writeFileSync(hookManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return {
    changed: added.length > 0,
    added,
    pending,
    skipped,
  };
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

const gallerySync = syncGalleries();
pending.push(...gallerySync.pending);
const hookSync = syncHookTraining();
pending.push(...hookSync.pending);
const hasUpdates = added.length > 0 || gallerySync.changed || hookSync.changed;

console.log(
  JSON.stringify(
    {
      status: hasUpdates ? (dryRun ? "dry-run" : "updated") : pending.length ? "pending" : "unchanged",
      sourceDir,
      added,
      pending,
      skippedCount: skipped.length,
      gallery: gallerySync,
      hooks: hookSync,
    },
    null,
    2,
  ),
);
