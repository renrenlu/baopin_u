"use client";

import { useEffect, useMemo, useState } from "react";

type ImageChoice = {
  choice: string;
  label: string;
  src: string;
};

type Work = {
  level: string;
  title: string;
  likes: string;
  published: string;
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
};

function choiceLabel(question: Question, choice: string) {
  if (question.mode === "judge") return choice === "high" ? "高赞" : "低赞";
  return question.images.find((image) => image.choice === choice)?.label ?? choice;
}

export default function TrainingSession({ issue, basePath }: TrainingSessionProps) {
  const storageKey = `baopin-hook-training:${issue.date}`;
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as SavedProgress;
        setChoices(saved.choices ?? {});
        setRevealed(saved.revealed ?? []);
      } catch {
        setChoices({});
        setRevealed([]);
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ choices, revealed }));
  }, [choices, ready, revealed, storageKey]);

  const correctCount = useMemo(
    () => revealed.filter((id) => {
      const question = issue.questions.find((item) => item.id === id);
      return question && choices[String(id)] === question.correct;
    }).length,
    [choices, issue.questions, revealed],
  );

  function choose(questionId: number, choice: string) {
    setChoices((current) => ({ ...current, [String(questionId)]: choice }));
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
    window.localStorage.removeItem(storageKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="training-session" aria-label={`${issue.date}钩子训练题目`}>
      <div className="training-progress" aria-live="polite">
        <div>
          <span>训练进度</span>
          <strong>{revealed.length} / {issue.questions.length} 题已查看答案</strong>
        </div>
        <p>{revealed.length ? `已答对 ${correctCount} 题` : "先选答案，再查看结果"}</p>
        <button type="button" onClick={reset}>重新练习</button>
      </div>

      <div className="training-question-list">
        {issue.questions.map((question) => {
          const selected = choices[String(question.id)];
          const isRevealed = revealed.includes(question.id);
          const isCorrect = selected === question.correct;

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
                        <span>{work.level}</span>
                        <h4>{work.title}</h4>
                        <dl>
                          <div><dt>博主</dt><dd>华丽蒙</dd></div>
                          <div><dt>点赞</dt><dd>{work.likes}</dd></div>
                          <div><dt>发布</dt><dd>{work.published}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
