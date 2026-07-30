import type { Metadata } from "next";
import trainingData from "@/data/hook-training.json";
import HookHeader from "../hooks/hook-header";
import HookGame, { type HookGameCard } from "./hook-game";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "钩子游戏｜每日爆品讯息",
  description: "把历期钩子训练重新组合成四种小游戏：找卧底、选冠军、高低赞混排和点赞排序。",
};

function likesToNumber(value: string) {
  const normalized = value.replaceAll(",", "").trim();
  const match = normalized.match(/([\d.]+)\s*万/);
  if (match) return Number(match[1]) * 10_000;
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function buildGameCards(): HookGameCard[] {
  return trainingData.issues.flatMap((issue) =>
    issue.questions.flatMap((question) =>
      question.images.flatMap((image) => {
        const level = question.mode === "compare"
          ? image.choice === question.correct ? "high" : "low"
          : question.correct === "high" ? "high" : "low";
        const sourceLevel = level === "high" ? "高赞" : "低赞";
        const work = question.works.find((item) => item.level === sourceLevel);
        if (!work) return [];

        return [{
          id: `${issue.date}-${question.id}-${image.choice}`,
          date: issue.date,
          image: image.src,
          level,
          title: work.title,
          likes: work.likes,
          likesValue: likesToNumber(work.likes),
          blogger: "blogger" in work && typeof work.blogger === "string"
            ? work.blogger
            : "原刊作者",
          videoUrl: work.videoUrl,
        } satisfies HookGameCard];
      }),
    ),
  );
}

export default function HookGamesPage() {
  const cards = buildGameCards();
  const highCount = cards.filter((card) => card.level === "high").length;
  const lowCount = cards.length - highCount;

  return (
    <main className="hook-shell" id="top">
      <HookHeader active="games" />
      <article className="hook-game-page">
        <header className="hook-game-hero">
          <div>
            <span>HOOK GAME · 重新洗牌</span>
            <h1>钩子游戏</h1>
          </div>
          <div>
            <p>把历期训练图片重新组合，不看答案再练一次。先凭第一眼判断，提交后再核对真实点赞数据。</p>
            <small>题库 {cards.length} 张 · 高赞 {highCount} · 低赞 {lowCount}</small>
          </div>
        </header>

        <HookGame cards={cards} basePath={BASE_PATH} />

        <footer className="site-footer gallery-footer">
          <p>钩子游戏 <span>·</span> 所有答案均来自原 PDF 标注</p>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </article>
    </main>
  );
}
