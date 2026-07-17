"use client";

import { useMemo, useState } from "react";

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

type GalleryDirectoryProps = {
  basePath: string;
  category: string;
  label: string;
  items: GalleryItem[];
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export default function GalleryDirectory({ basePath, category, label, items }: GalleryDirectoryProps) {
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return items;
    return items.filter((item) => `${item.title} ${item.searchText}`.toLocaleLowerCase("zh-CN").includes(normalized));
  }, [items, query]);

  return (
    <>
      <div className="gallery-search-row">
        <label className="gallery-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题或文字内容…"
            aria-label={`搜索${label}图片与文字内容`}
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">×</button> : null}
        </label>
        <span>{visibleItems.length} / {items.length}</span>
      </div>

      {visibleItems.length ? (
        <div className="gallery-grid">
          {visibleItems.map((item) => {
            const textHref = `${basePath}/gallery/${category}/${item.slug}/`;
            return (
              <article className="gallery-card" key={item.slug}>
                <a className="gallery-card-main" href={textHref} aria-label={`阅读《${item.title}》文字版`}>
                  <figure>
                    <div className="gallery-thumbnail">
                      <img src={`${basePath}${item.thumbnail}`} alt="" loading="lazy" />
                      <span>查看文字版 ↗</span>
                    </div>
                    <figcaption>
                      <h2>{item.title}</h2>
                      {item.excerpt ? <p className="gallery-card-excerpt">{item.excerpt}</p> : null}
                      <p className="gallery-card-meta">{formatDate(item.collected)} · {label}</p>
                    </figcaption>
                  </figure>
                </a>
                <div className="gallery-card-actions">
                  <a href={textHref}>阅读文字版</a>
                  <a href={`${basePath}${item.image}`} target="_blank" rel="noreferrer">高清原图 ↗</a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="gallery-empty">
          <p>没有找到“{query}”</p>
          <button type="button" onClick={() => setQuery("")}>清空搜索</button>
        </div>
      )}
    </>
  );
}
