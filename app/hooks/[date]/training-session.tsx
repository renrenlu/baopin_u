"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getHookInsight } from "../hook-insights";
import { recordTrainingAnswer } from "../training-activity";

type ImageChoice = {
  choice: string;
  label: string;
  src: string;
};

type Work = {
  level: string;
  blogger?: string;
  title: string;
  likes: string;
  published: string;
  videoUrl?: string;
};

type Question = {
  id: number;
  mode: string;
  prompt: string;
  images: ImageChoice[];
  correct: string;
  answerLabel: string;
  works: Work[];
};

type TrainingIssue = {
  date: string;
  title: string;
  description: string;
  pdf: string;
  questions: Question[];
};

type TrainingSessionProps = {
  issue: TrainingIssue;
  basePath: string;
};

type SavedProgress = {
  choices?: Record<string, string>;
  revealed?: number[];
  updatedAt?: string;
  completedAt?: string;
};

function choiceLabel(question: Question, choice: string) {
  if (question.mode === "judge") return choice === "high" ? "高赞" : "低赞";
  return question.images.find((image) => image.choice === choice)?.label ?? choice;
}

export default function TrainingSession({ issue, basePath }: TrainingSessionProps) {
  const storageKey = `baopin-hook-training:${issue.date}`;
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<number[]>([]);
  const answeredIdsRef = useRef<Set<string>>(new Set());
  const completedAtRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as SavedProgress;
        const savedChoices = saved.choices ?? {};
        setChoices(savedChoices);
        setRevealed(saved.revealed ?? []);
        answeredIdsRef.current = new Set(
          Object.entries(savedChoices)
            .filter(([, choice]) => Boolean(choice))
            .map(([id]) => id),
        );
        completedAtRef.current = saved.completedAt;
      } catch {
        setChoices({});
        setRevealed([]);
        answeredIdsRef.current = new Set();
        completedAtRef.current = undefined;
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  const answeredCount = useMemo(
    () => issue.questions.filter((question) => Boolean(choices[String(question.id)])).length,
    [choices, issue.questions],
  );
  const correctCount = useMemo(
    () => issue.questions.filter(
      (question) => choices[String(question.id)] === question.correct,
    ).length,
    [choices, issue.questions],
  );
  const isComplete = answeredCount === issue.questions.length;
  const scorePercent = isComplete
    ? Math.round((correctCount / issue.questions.length) * 100)
    : 0;

  useEffect(() => {
    if (!ready) return;
    const now = new Date().toISOString();
    if (isComplete && !completedAtRef.current) completedAtRef.current = now;
    if (!isComplete) completedAtRef.current = undefined;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        choices,
        revealed,
        updatedAt: now,
        completedAt: completedAtRef.current,
      }),
    );
    window.dispatchEvent(new Event("baopin-hook-progress"));
  }, [choices, isComplete, ready, revealed, storageKey]);

  function choose(questionId: number, choice: string) {
    const id = String(questionId);
    if (!answeredIdsRef.current.has(id)) {
      answeredIdsRef.current.add(id);
      recordTrainingAnswer();
    }
    setChoices((current) => ({ ...current, [id]: choice }));
  }

  function toggleAnswer(questionId: number) {
    setRevealed((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  }

  function reset() {
    setChoices({});
    setRevealed([]);
    answeredIdsRef.current = new Set();
    completedAtRef.current = undefined;
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("baopin-hook-progress"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="training-session" aria-label={`${issue.date}钩子训练题目`}>
      <div className="training-progress" aria-live="polite">
        <div>
          <span>训练进度</span>
          <strong>{answeredCount} / {issue.questions.length} 题已作答</strong>
        </div>
        <p>
          {isComplete
            ? "全部完成，成绩已保存"
            : answeredCount
              ? `还差 ${issue.questions.length - answeredCount} 题`
              : "先选答案，再查看结果"}
        </p>
        <button type="button" onClick={reset}>重新练习</button>
      </div>

      {isComplete ? (
        <section className="training-score-card" aria-live="polite" aria-label={`本期得分 ${scorePercent}%`}>
          <div className="training-score-value">
            <span>SCORE</span>
            <strong>{scorePercent}<small>%</small></strong>
            <p>{scorePercent >= 80 ? "判断力很稳" : scorePercent >= 60 ? "已经抓到感觉" : "继续对照钩子差异"}</p>
          </div>
          <div className="training-score-detail">
            <div>
              <span>答对</span>
              <strong>{correctCount}</strong>
            </div>
            <div>
              <span>答错</span>
              <strong>{issue.questions.length - correctCount}</strong>
            </div>
            <div>
              <span>已看答案</span>
              <strong>{revealed.length}</strong>
            </div>
          </div>
          <div className="training-score-dots" aria-label="逐题结果">
            {issue.questions.map((question) => {
              const correct = choices[String(question.id)] === question.correct;
              return (
                <a
                  className={correct ? "correct" : "wrong"}
                  href={`#question-${question.id}`}
                  aria-label={`第 ${question.id} 题${correct ? "正确" : "错误"}`}
                  key={question.id}
                >
                  {question.id}
                </a>
              );
            })}
          </div>
          <a className="training-history-link" href={`${basePath}/hooks/#training-history-title`}>
            查看每日训练趋势 →
          </a>
        </section>
      ) : null}

      <div className="training-question-list">
        {issue.questions.map((question) => {
          const selected = choices[String(question.id)];
          const isRevealed = revealed.includes(question.id);
          const isCorrect = selected === question.correct;
          const insight = question.works.length > 1
            ? getHookInsight(issue.date, question.id, question.works)
            : null;

          return (
            <section className="training-question" id={`question-${question.id}`} key={question.id}>
              <header className="training-question-heading">
                <span>QUESTION {String(question.id).padStart(2, "0")}</span>
                <div>
                  <small>{question.mode === "compare" ? "方式一 · 辨高低赞" : "方式二 · 判高低赞"}</small>
                  <h2>{question.prompt}</h2>
                </div>
              </header>

              <div className={question.mode === "compare" ? "training-visuals compare" : "training-visuals single"}>
                {question.images.map((image) => {
                  const chosen = selected === image.choice;
                  const correctVisual = isRevealed && question.mode === "compare" && image.choice === question.correct;
                  const wrongVisual = isRevealed && chosen && image.choice !== question.correct;
                  return (
                    <button
                      className={`training-visual-choice${chosen ? " selected" : ""}${correctVisual ? " correct" : ""}${wrongVisual ? " wrong" : ""}`}
                      type="button"
                      key={image.choice}
                      onClick={() => question.mode === "compare" && choose(question.id, image.choice)}
                      disabled={question.mode !== "compare"}
                      aria-pressed={question.mode === "compare" ? chosen : undefined}
                    >
                      <span>{image.label}{chosen ? " · 已选择" : ""}</span>
                      {/* Source frames come directly from the PDF and keep their original aspect ratios. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${basePath}${image.src}`} alt={`第 ${question.id} 题${image.label}`} loading="lazy" />
                    </button>
                  );
                })}
              </div>

              {question.mode === "judge" ? (
                <div className="training-judge-options" role="group" aria-label={`第 ${question.id} 题选项`}>
                  {[
                    ["high", "高赞"],
                    ["low", "低赞"],
                  ].map(([value, label]) => (
                    <button
                      className={selected === value ? "selected" : undefined}
                      type="button"
                      onClick={() => choose(question.id, value)}
                      aria-pressed={selected === value}
                      key={value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="training-answer-control">
                <div>
                  <span>你的判断</span>
                  <strong>{selected ? choiceLabel(question, selected) : "尚未选择"}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAnswer(question.id)}
                  aria-expanded={isRevealed}
                  aria-controls={`answer-${question.id}`}
                >
                  {isRevealed ? "收起答案" : "查看答案"}
                  <span aria-hidden="true">{isRevealed ? "−" : "+"}</span>
                </button>
              </div>

              {isRevealed ? (
                <div className="training-answer" id={`answer-${question.id}`}>
                  <header>
                    <span>{selected ? (isCorrect ? "判断正确" : "再观察一下") : "参考答案"}</span>
                    <h3>{question.answerLabel}</h3>
                  </header>
                  <p>以下为原 PDF 给出的作品数据。</p>
                  <div className="training-work-grid">
                    {question.works.map((work) => (
                      <article className={work.level === "高赞" ? "high" : "low"} key={`${work.level}-${work.title}`}>
                        <header>
                          <span>{work.level === "高赞" ? "高赞钩子" : "低赞钩子"}</span>
                          <small>钩子原文</small>
                        </header>
                        <blockquote>{work.title}</blockquote>
                        <dl>
                          <div><dt>博主</dt><dd>{work.blogger ?? "华丽蒙"}</dd></div>
                          <div><dt>点赞</dt><dd>{work.likes}</dd></div>
                          <div><dt>发布</dt><dd>{work.published}</dd></div>
                        </dl>
                        {work.videoUrl ? (
                          <a
                            className="training-video-link"
                            href={work.videoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            <span>打开原视频</span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                  {insight ? (
                    <div className="training-hook-observation">
                      <header>
                        <span>对比拆解</span>
                        {insight.likeGap ? <strong>点赞差距约 {insight.likeGap}</strong> : null}
                      </header>
                      <div>
                        <section className="high">
                          <span>高赞有效点</span>
                          <p>{insight.highSignal}</p>
                        </section>
                        <section className="low">
                          <span>低赞薄弱点</span>
                          <p>{insight.lowSignal}</p>
                        </section>
                        <section className="takeaway">
                          <span>直接复用</span>
                          <p>{insight.takeaway}</p>
                        </section>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
