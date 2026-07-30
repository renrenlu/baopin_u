"use client";

import { useMemo, useState } from "react";
import { recordTrainingAnswer } from "../hooks/training-activity";

export type HookGameCard = {
  id: string;
  date: string;
  image: string;
  level: "high" | "low";
  title: string;
  likes: string;
  likesValue: number;
  blogger: string;
  videoUrl?: string;
};

type GameMode = "spy" | "champion" | "mixed" | "ranking";
type GameChoice = GameMode | "combo";

type GameRound = {
  key: string;
  mode: GameMode;
  cards: HookGameCard[];
};

const MODE_ORDER: GameMode[] = ["spy", "champion", "mixed", "ranking"];

const MODE_DETAILS: Record<GameChoice, {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
}> = {
  spy: {
    eyebrow: "FIND THE SPY",
    title: "低赞卧底",
    description: "3 张高赞里藏着 1 张低赞，找出那条“看起来不错、实际传播弱”的内容。",
    badge: "4 选 1",
  },
  champion: {
    eyebrow: "FIND THE WINNER",
    title: "高赞冠军",
    description: "3 张低赞里藏着 1 张高赞，训练第一眼发现真正的爆款。",
    badge: "4 选 1",
  },
  mixed: {
    eyebrow: "SIX-WAY MIX",
    title: "高低赞混排",
    description: "一次出现 6 张图，逐张判断高赞或低赞，全部选完再统一提交。",
    badge: "6 张图",
  },
  ranking: {
    eyebrow: "LIKE RANKING",
    title: "点赞排序",
    description: "把 4 张图片按真实点赞数从高到低排列，考验对传播量级的判断。",
    badge: "最高难度",
  },
  combo: {
    eyebrow: "25% × 4",
    title: "综合挑战",
    description: "连续完成四关，每种游戏恰好出现一次，各占最终成绩的 25%。",
    badge: "4 种全练",
  },
};

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function pick(items: HookGameCard[], count: number) {
  return shuffle(items).slice(0, count);
}

function rankingCards(cards: HookGameCard[]) {
  const high = pick(cards.filter((card) => card.level === "high" && card.likesValue > 0), 2);
  const low = pick(cards.filter((card) => card.level === "low" && card.likesValue > 0), 2);
  const chosen: HookGameCard[] = [];
  for (const card of shuffle([...high, ...low, ...cards])) {
    if (card.likesValue <= 0) continue;
    if (chosen.some((item) => item.id === card.id || item.likesValue === card.likesValue)) continue;
    chosen.push(card);
    if (chosen.length === 4) break;
  }
  return shuffle(chosen);
}

function makeRound(mode: GameMode, cards: HookGameCard[]): GameRound {
  const high = cards.filter((card) => card.level === "high");
  const low = cards.filter((card) => card.level === "low");
  let selected: HookGameCard[];

  if (mode === "spy") selected = shuffle([...pick(high, 3), ...pick(low, 1)]);
  else if (mode === "champion") selected = shuffle([...pick(low, 3), ...pick(high, 1)]);
  else if (mode === "mixed") selected = shuffle([...pick(high, 3), ...pick(low, 3)]);
  else selected = rankingCards(cards);

  return {
    key: `${mode}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mode,
    cards: selected,
  };
}

function modeName(mode: GameMode) {
  return MODE_DETAILS[mode].title;
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function rankScore(cards: HookGameCard[]) {
  let correctPairs = 0;
  let allPairs = 0;
  for (let left = 0; left < cards.length; left += 1) {
    for (let right = left + 1; right < cards.length; right += 1) {
      allPairs += 1;
      if (cards[left].likesValue >= cards[right].likesValue) correctPairs += 1;
    }
  }
  return allPairs ? correctPairs / allPairs : 0;
}

function scoreMessage(score: number) {
  if (score >= 0.9) return "爆款判断很稳";
  if (score >= 0.65) return "已经抓到传播信号";
  if (score >= 0.4) return "有感觉，再看一次真实数据";
  return "先别急，答案里正藏着差异";
}

type HookGameProps = {
  cards: HookGameCard[];
  basePath: string;
};

export default function HookGame({ cards, basePath }: HookGameProps) {
  const [choice, setChoice] = useState<GameChoice | null>(null);
  const [comboModes, setComboModes] = useState<GameMode[]>([]);
  const [comboIndex, setComboIndex] = useState(0);
  const [comboScores, setComboScores] = useState<number[]>([]);
  const [round, setRound] = useState<GameRound | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [judgments, setJudgments] = useState<Record<string, "high" | "low">>({});
  const [orderedCards, setOrderedCards] = useState<HookGameCard[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number>();

  const correctRanking = useMemo(
    () => round?.mode === "ranking"
      ? [...round.cards].sort((a, b) => b.likesValue - a.likesValue)
      : [],
    [round],
  );

  function prepareRound(mode: GameMode) {
    const next = makeRound(mode, cards);
    setRound(next);
    setSelectedId(undefined);
    setJudgments({});
    setOrderedCards(next.cards);
    setSubmitted(false);
    setRoundScore(0);
    window.requestAnimationFrame(() => {
      document.getElementById("game-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function start(nextChoice: GameChoice) {
    setChoice(nextChoice);
    setComboScores([]);
    setComboIndex(0);
    setFinalScore(undefined);
    if (nextChoice === "combo") {
      const modes = shuffle(MODE_ORDER);
      setComboModes(modes);
      prepareRound(modes[0]);
    } else {
      setComboModes([]);
      prepareRound(nextChoice);
    }
  }

  function submit() {
    if (!round || submitted) return;
    let score = 0;
    let answerCount = 1;

    if (round.mode === "spy") {
      score = round.cards.find((card) => card.level === "low")?.id === selectedId ? 1 : 0;
    } else if (round.mode === "champion") {
      score = round.cards.find((card) => card.level === "high")?.id === selectedId ? 1 : 0;
    } else if (round.mode === "mixed") {
      const correct = round.cards.filter((card) => judgments[card.id] === card.level).length;
      answerCount = round.cards.length;
      score = correct / answerCount;
    } else {
      answerCount = round.cards.length;
      score = rankScore(orderedCards);
    }

    for (let index = 0; index < answerCount; index += 1) recordTrainingAnswer();
    setRoundScore(score);
    setSubmitted(true);

    if (choice === "combo") {
      const scores = [...comboScores, score];
      setComboScores(scores);
      if (comboIndex === comboModes.length - 1) {
        setFinalScore(Math.round((scores.reduce((total, item) => total + item, 0) / 4) * 100));
      }
    }
  }

  function next() {
    if (!round || !choice) return;
    if (choice === "combo" && comboIndex < comboModes.length - 1) {
      const nextIndex = comboIndex + 1;
      setComboIndex(nextIndex);
      prepareRound(comboModes[nextIndex]);
    } else if (choice !== "combo") {
      prepareRound(round.mode);
    }
  }

  function moveCard(index: number, direction: -1 | 1) {
    if (submitted) return;
    const target = index + direction;
    if (target < 0 || target >= orderedCards.length) return;
    setOrderedCards((current) => {
      const nextOrder = [...current];
      [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
      return nextOrder;
    });
  }

  const canSubmit = round
    ? round.mode === "mixed"
      ? Object.keys(judgments).length === round.cards.length
      : round.mode === "ranking"
        ? orderedCards.length === 4
        : Boolean(selectedId)
    : false;

  return (
    <section className="hook-game-lab" aria-label="钩子游戏">
      <div className="hook-game-rule">
        <span>判定规则</span>
        <p>高赞、低赞和点赞数均直接读取原 PDF。游戏只会重新洗牌，不会重新判断标签。</p>
      </div>

      <section className="hook-game-mode-section" aria-labelledby="hook-game-mode-title">
        <header>
          <span>CHOOSE A MODE</span>
          <h2 id="hook-game-mode-title">选择玩法</h2>
        </header>
        <div className="hook-game-mode-grid">
          {MODE_ORDER.map((mode, index) => {
            const detail = MODE_DETAILS[mode];
            return (
              <button
                className={choice === mode ? "selected" : undefined}
                type="button"
                onClick={() => start(mode)}
                key={mode}
              >
                <span>{String(index + 1).padStart(2, "0")} · {detail.eyebrow}</span>
                <h3>{detail.title}</h3>
                <p>{detail.description}</p>
                <strong>{detail.badge}<i aria-hidden="true">→</i></strong>
              </button>
            );
          })}
          <button
            className={`combo${choice === "combo" ? " selected" : ""}`}
            type="button"
            onClick={() => start("combo")}
          >
            <span>{MODE_DETAILS.combo.eyebrow}</span>
            <h3>{MODE_DETAILS.combo.title}</h3>
            <p>{MODE_DETAILS.combo.description}</p>
            <strong>{MODE_DETAILS.combo.badge}<i aria-hidden="true">→</i></strong>
          </button>
        </div>
      </section>

      {round ? (
        <section className="hook-game-stage" id="game-stage" key={round.key}>
          <header className="hook-game-stage-heading">
            <div>
              <span>
                {choice === "combo"
                  ? `综合挑战 · 第 ${comboIndex + 1} / 4 关 · 本关占 25%`
                  : MODE_DETAILS[round.mode].eyebrow}
              </span>
              <h2>{modeName(round.mode)}</h2>
            </div>
            <button type="button" onClick={() => start(choice ?? round.mode)}>重新洗牌</button>
          </header>

          {round.mode === "spy" || round.mode === "champion" ? (
            <>
              <p className="hook-game-instruction">
                {round.mode === "spy" ? "选出唯一的低赞作品。" : "选出唯一的高赞作品。"}
                提交前不显示标题和点赞数。
              </p>
              <div className="hook-game-card-grid four">
                {round.cards.map((card, index) => (
                  <GameCard
                    card={card}
                    index={index}
                    basePath={basePath}
                    selected={selectedId === card.id}
                    targetLevel={round.mode === "spy" ? "low" : "high"}
                    submitted={submitted}
                    onSelect={() => !submitted && setSelectedId(card.id)}
                    key={card.id}
                  />
                ))}
              </div>
            </>
          ) : null}

          {round.mode === "mixed" ? (
            <>
              <p className="hook-game-instruction">逐张选择高赞或低赞，6 张全部判断后才能提交。</p>
              <div className="hook-game-card-grid mixed">
                {round.cards.map((card, index) => (
                  <GameCard
                    card={card}
                    index={index}
                    basePath={basePath}
                    selected={Boolean(judgments[card.id])}
                    selectedLevel={judgments[card.id]}
                    submitted={submitted}
                    onJudge={(level) => !submitted && setJudgments((current) => ({
                      ...current,
                      [card.id]: level,
                    }))}
                    key={card.id}
                  />
                ))}
              </div>
            </>
          ) : null}

          {round.mode === "ranking" ? (
            <>
              <p className="hook-game-instruction">使用上下按钮调整次序，第 1 名应是你判断点赞数最高的作品。</p>
              <div className="hook-game-ranking">
                {orderedCards.map((card, index) => {
                  const correctIndex = correctRanking.findIndex((item) => item.id === card.id);
                  return (
                    <article className={submitted ? (correctIndex === index ? "correct" : "wrong") : undefined} key={card.id}>
                      <div className="hook-game-rank-number">
                        <span>你的排序</span>
                        <strong>{index + 1}</strong>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${basePath}${card.image}`} alt={`排序作品 ${index + 1}`} />
                      <div className="hook-game-rank-copy">
                        {submitted ? (
                          <>
                            <span>{card.level === "high" ? "高赞" : "低赞"} · 真实第 {correctIndex + 1} 名</span>
                            <h3>{card.title}</h3>
                            <strong>{card.likes} 赞</strong>
                          </>
                        ) : (
                          <>
                            <span>作品 {String(index + 1).padStart(2, "0")}</span>
                            <h3>判断它的真实点赞量级</h3>
                            <a href={`${basePath}${card.image}`} target="_blank" rel="noreferrer">查看高清图 ↗</a>
                          </>
                        )}
                      </div>
                      <div className="hook-game-rank-controls">
                        <button type="button" onClick={() => moveCard(index, -1)} disabled={submitted || index === 0} aria-label={`将第 ${index + 1} 张上移`}>↑</button>
                        <button type="button" onClick={() => moveCard(index, 1)} disabled={submitted || index === orderedCards.length - 1} aria-label={`将第 ${index + 1} 张下移`}>↓</button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {submitted ? (
                <div className="hook-game-true-ranking">
                  <span>真实点赞排序</span>
                  <ol>
                    {correctRanking.map((card) => (
                      <li key={card.id}>
                        <strong>{card.likes} 赞</strong>
                        <span>{card.title}</span>
                        {card.videoUrl ? <a href={card.videoUrl} target="_blank" rel="noreferrer noopener">原视频 ↗</a> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </>
          ) : null}

          <footer className="hook-game-submit">
            <div>
              <span>
                {round.mode === "mixed"
                  ? `已判断 ${Object.keys(judgments).length} / 6`
                  : round.mode === "ranking"
                    ? "从高到低排列"
                    : selectedId ? "已选择 1 张" : "请选择 1 张"}
              </span>
              <strong>
                {submitted
                  ? `本局 ${Math.round(roundScore * 100)} 分 · ${scoreMessage(roundScore)}`
                  : "提交后揭晓真实标签和点赞数"}
              </strong>
            </div>
            {!submitted ? (
              <button type="button" onClick={submit} disabled={!canSubmit}>提交答案</button>
            ) : choice === "combo" && finalScore !== undefined ? null : (
              <button type="button" onClick={next}>
                {choice === "combo" ? "进入下一关" : "同模式再来一局"}
              </button>
            )}
          </footer>

          {choice === "combo" ? (
            <div className="hook-game-combo-progress" aria-label="综合挑战进度">
              {comboModes.map((mode, index) => (
                <div className={index < comboScores.length ? "done" : index === comboIndex ? "active" : undefined} key={mode}>
                  <span>{index + 1}</span>
                  <strong>{modeName(mode)}</strong>
                  <small>{comboScores[index] === undefined ? "25%" : `${Math.round(comboScores[index] * 100)} 分 × 25%`}</small>
                </div>
              ))}
            </div>
          ) : null}

          {finalScore !== undefined ? (
            <section className="hook-game-final" aria-live="polite">
              <span>COMBINED SCORE</span>
              <strong>{finalScore}<small>%</small></strong>
              <h2>{scoreMessage(finalScore / 100)}</h2>
              <p>四种游戏各占 25%，最终成绩是四关得分的等权平均。</p>
              <button type="button" onClick={() => start("combo")}>重新开始综合挑战</button>
            </section>
          ) : null}
        </section>
      ) : (
        <div className="hook-game-empty">
          <span>从上面选择一种玩法</span>
          <p>题目会从历期训练中随机抽取，每次重新洗牌都会得到不同组合。</p>
        </div>
      )}
    </section>
  );
}

type GameCardProps = {
  card: HookGameCard;
  index: number;
  basePath: string;
  selected: boolean;
  selectedLevel?: "high" | "low";
  targetLevel?: "high" | "low";
  submitted: boolean;
  onSelect?: () => void;
  onJudge?: (level: "high" | "low") => void;
};

function GameCard({
  card,
  index,
  basePath,
  selected,
  selectedLevel,
  targetLevel,
  submitted,
  onSelect,
  onJudge,
}: GameCardProps) {
  const correct = submitted && (
    selectedLevel
      ? selectedLevel === card.level
      : targetLevel
        ? card.level === targetLevel
        : selected
  );
  const wrong = submitted && selected && (
    selectedLevel
      ? selectedLevel !== card.level
      : targetLevel
        ? card.level !== targetLevel
        : !correct
  );

  return (
    <article className={`hook-game-card${selected ? " selected" : ""}${correct ? " correct" : ""}${wrong ? " wrong" : ""}`}>
      <button type="button" onClick={onSelect} disabled={!onSelect || submitted} aria-pressed={onSelect ? selected : undefined}>
        <span>作品 {String(index + 1).padStart(2, "0")}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}${card.image}`} alt={`游戏作品 ${index + 1}`} loading="lazy" />
        {selected && !submitted ? <i>已选择</i> : null}
        {submitted ? <i className={card.level}>{card.level === "high" ? "高赞" : "低赞"}</i> : null}
      </button>
      {!submitted ? (
        <a href={`${basePath}${card.image}`} target="_blank" rel="noreferrer">查看高清图 ↗</a>
      ) : (
        <div className="hook-game-reveal">
          <span>{card.level === "high" ? "高赞作品" : "低赞作品"} · {formatDate(card.date)}</span>
          <h3>{card.title}</h3>
          <dl>
            <div><dt>点赞</dt><dd>{card.likes}</dd></div>
            <div><dt>博主</dt><dd>{card.blogger}</dd></div>
          </dl>
          {card.videoUrl ? <a href={card.videoUrl} target="_blank" rel="noreferrer noopener">打开原视频 ↗</a> : null}
        </div>
      )}
      {onJudge ? (
        <div className="hook-game-judge" role="group" aria-label={`作品 ${index + 1} 高低赞判断`}>
          <button className={selectedLevel === "high" ? "selected" : undefined} type="button" onClick={() => onJudge("high")} disabled={submitted}>高赞</button>
          <button className={selectedLevel === "low" ? "selected" : undefined} type="button" onClick={() => onJudge("low")} disabled={submitted}>低赞</button>
        </div>
      ) : null}
    </article>
  );
}
