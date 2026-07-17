import type { Metadata } from "next";
import { notFound } from "next/navigation";
import galleryData from "@/data/galleries.json";
import GalleryDirectory from "./gallery-directory";

type GalleryItem = {
  slug: string;
  title: string;
  collected: string;
  excerpt: string;
  searchText: string;
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

type GalleryPageProps = {
  params: Promise<{ category: string }>;
};

const GALLERIES = galleryData as Gallery[];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamicParams = false;

export function generateStaticParams() {
  return GALLERIES.map((gallery) => ({ category: gallery.slug }));
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { category } = await params;
  const gallery = GALLERIES.find((item) => item.slug === category);
  return gallery
    ? {
        title: `${gallery.label}大目录｜每日爆品讯息`,
        description: gallery.description,
      }
    : {};
}

function galleryHref(slug: string) {
  return `${BASE_PATH}/gallery/${slug}/`;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { category } = await params;
  const gallery = GALLERIES.find((item) => item.slug === category);
  if (!gallery) notFound();

  return (
    <main className="gallery-shell" id="top">
      <header className="topbar">
        <a className="brand" href={`${BASE_PATH}/`} aria-label="返回每日爆品讯息首页">
          <span className="brand-mark" aria-hidden="true">爆</span>
          <span className="brand-name">每日爆品讯息</span>
          <span className="brand-note">VISUAL ARCHIVE</span>
        </a>
        <nav className="topnav" aria-label="主导航">
          <a href={`${BASE_PATH}/`}>爆品讯息</a>
          {GALLERIES.map((item) => (
            <a className={item.slug === gallery.slug ? "active" : undefined} href={galleryHref(item.slug)} key={item.slug}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <nav className="gallery-mobile-tabs" aria-label="图片栏目">
        <a href={`${BASE_PATH}/`}>爆品讯息</a>
        {GALLERIES.map((item) => (
          <a className={item.slug === gallery.slug ? "active" : undefined} href={galleryHref(item.slug)} key={item.slug}>
            {item.label}
          </a>
        ))}
      </nav>

      <section className="gallery-page">
        <header className="gallery-heading">
          <div>
            <span>VISUAL DIRECTORY · 图片大目录</span>
            <h1>{gallery.label}</h1>
          </div>
          <div className="gallery-intro">
            <p>{gallery.description}</p>
            <strong>{gallery.items.length} 张图片</strong>
          </div>
        </header>

        {gallery.items.length ? (
          <GalleryDirectory
            basePath={BASE_PATH}
            category={gallery.slug}
            label={gallery.label}
            items={gallery.items}
          />
        ) : (
          <div className="gallery-empty">这个目录还没有图片，Obsidian 新增后会在下一次同步时出现。</div>
        )}

        <footer className="site-footer gallery-footer">
          <p>{gallery.label} <span>·</span> 图片来自 Obsidian 同名目录</p>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </section>
    </main>
  );
}
