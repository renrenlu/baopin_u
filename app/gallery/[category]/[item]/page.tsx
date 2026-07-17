import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { notFound } from "next/navigation";
import galleryData from "@/data/galleries.json";

type GalleryItem = {
  slug: string;
  title: string;
  collected: string;
  excerpt: string;
  image: string;
  thumbnail: string;
  content: string | null;
};

type Gallery = {
  slug: string;
  label: string;
  description: string;
  items: GalleryItem[];
};

type GalleryTextPageProps = {
  params: Promise<{ category: string; item: string }>;
};

const GALLERIES = galleryData as Gallery[];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamicParams = false;

export function generateStaticParams() {
  return GALLERIES.flatMap((gallery) =>
    gallery.items
      .filter((item) => item.content)
      .map((item) => ({ category: gallery.slug, item: item.slug })),
  );
}

function findEntry(category: string, itemSlug: string) {
  const gallery = GALLERIES.find((entry) => entry.slug === category);
  const item = gallery?.items.find((entry) => entry.slug === itemSlug);
  return gallery && item ? { gallery, item } : null;
}

export async function generateMetadata({ params }: GalleryTextPageProps): Promise<Metadata> {
  const { category, item } = await params;
  const entry = findEntry(category, item);
  return entry
    ? {
        title: `${entry.item.title}｜${entry.gallery.label}文字版`,
        description: entry.item.excerpt || `${entry.gallery.label}图片对应的完整文字版。`,
      }
    : {};
}

function normalizeMarkdown(markdown: string) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^#\s+.+\r?\n/m, "")
    .replace(/^原图：.*\r?\n?/m, "")
    .replace(/!\[\[.*?\]\]/g, "")
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
    .trim();
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function galleryHref(slug: string) {
  return `${BASE_PATH}/gallery/${slug}/`;
}

export default async function GalleryTextPage({ params }: GalleryTextPageProps) {
  const { category, item: itemSlug } = await params;
  const entry = findEntry(category, itemSlug);
  if (!entry || !entry.item.content) notFound();

  const contentPath = path.join(
    process.cwd(),
    "content",
    "galleries",
    entry.gallery.slug,
    `${entry.item.slug}.md`,
  );
  if (!existsSync(contentPath)) notFound();
  const markdown = normalizeMarkdown(readFileSync(contentPath, "utf8"));
  const html = await marked.parse(markdown, { gfm: true, breaks: false });

  return (
    <main className="gallery-detail-shell" id="top">
      <header className="topbar">
        <a className="brand" href={`${BASE_PATH}/`} aria-label="返回每日爆品讯息首页">
          <span className="brand-mark" aria-hidden="true">爆</span>
          <span className="brand-name">每日爆品讯息</span>
          <span className="brand-note">TEXT ARCHIVE</span>
        </a>
        <nav className="topnav" aria-label="主导航">
          <a href={`${BASE_PATH}/`}>爆品讯息</a>
          {GALLERIES.map((gallery) => (
            <a className={gallery.slug === entry.gallery.slug ? "active" : undefined} href={galleryHref(gallery.slug)} key={gallery.slug}>
              {gallery.label}
            </a>
          ))}
        </nav>
      </header>

      <nav className="gallery-mobile-tabs" aria-label="图片栏目">
        <a href={`${BASE_PATH}/`}>爆品讯息</a>
        {GALLERIES.map((gallery) => (
          <a className={gallery.slug === entry.gallery.slug ? "active" : undefined} href={galleryHref(gallery.slug)} key={gallery.slug}>
            {gallery.label}
          </a>
        ))}
      </nav>

      <article className="gallery-detail-page">
        <header className="gallery-detail-hero">
          <a className="gallery-breadcrumb" href={galleryHref(entry.gallery.slug)}>← 返回{entry.gallery.label}大目录</a>
          <div className="gallery-detail-meta">
            <span>{entry.gallery.label}</span>
            <time dateTime={entry.item.collected}>{formatDate(entry.item.collected)}</time>
            <span>图片对应文字版</span>
          </div>
          <h1>{entry.item.title}</h1>
          {entry.item.excerpt ? <p>{entry.item.excerpt}</p> : null}
        </header>

        <div className="gallery-detail-layout">
          <aside className="gallery-detail-visual">
            <a href={`${BASE_PATH}${entry.item.image}`} target="_blank" rel="noreferrer" aria-label={`打开《${entry.item.title}》高清原图`}>
              <img src={`${BASE_PATH}${entry.item.thumbnail}`} alt={`${entry.item.title}图片预览`} />
              <span>点击查看高清长图 ↗</span>
            </a>
            <div className="gallery-detail-tools">
              <span>⌘ / Ctrl + F 可搜索本页文字</span>
              <a href={`${BASE_PATH}${entry.item.image}`} target="_blank" rel="noreferrer">打开高清原图</a>
            </div>
          </aside>

          <section className="gallery-text-panel" aria-label={`${entry.item.title}完整文字版`}>
            <div className="gallery-text-label">
              <span>FULL TEXT</span>
              <strong>完整文字版</strong>
            </div>
            <div className="gallery-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </section>
        </div>

        <footer className="site-footer gallery-footer">
          <p>{entry.gallery.label} <span>·</span> 图片与文字来自 Obsidian 同名文件</p>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </article>
    </main>
  );
}
