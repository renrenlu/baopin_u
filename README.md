# 每日爆品讯息

把 U 哥每日爆品 PDF 整理成可按日期浏览、搜索和下载的交互式档案站。

## 当前内容

- 自动同步 Obsidian 素材库中已完成文字提取与当日导读的新期刊
- 自动同步 Obsidian `photo_u` 中的社会热点、读书分享和爆款裂变图片及同名 Markdown 文字版
- 图片目录支持标题与全文检索，每张图片都有独立的图文阅读页
- 左侧月份、日期和标题导航
- 每期导读摘要、关键词与一句话规律
- PDF 在线阅读与下载
- 桌面端和移动端响应式布局

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

推送到 `main` 后，GitHub Actions 会自动构建并发布 GitHub Pages。

## 自动同步

运行 `npm run sync:obsidian` 会扫描 Obsidian 的 `06-素材库` 与 `photo_u`。期刊只追加网站尚未收录的 PDF；图库会追加高清原图和缩略图，并同步同名 Markdown 作为可搜索文字版。同步前会等待同日期的“PDF 文字提取”和“当日导读”生成完成；不会覆盖网站中已有期刊或高清原图。
