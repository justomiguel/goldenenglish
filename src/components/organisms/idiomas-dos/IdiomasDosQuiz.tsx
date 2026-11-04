"use client";

import { useState } from "react";
import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./idiomasDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["idiomas2"];

export function IdiomasDosQuiz({
  copy,
  onLevel,
  lead,
}: {
  copy: Copy;
  onLevel: (level: string) => void;
  lead?: { title: string; body: string };
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [need, setNeed] = useState(false);
  const question = copy.questions[step];
  const band = [...copy.bands].reverse().find((item) => score >= item.min) ?? copy.bands[0];
  const progress = done ? 100 : Math.round((step / copy.questions.length) * 100);

  function next() {
    if (picked === null || !question) {
      setNeed(true);
      return;
    }
    const nextScore = score + (picked === question.answer ? 1 : 0);
    setScore(nextScore);
    setPicked(null);
    setNeed(false);
    if (step + 1 >= copy.questions.length) setDone(true);
    else setStep(step + 1);
  }

  function restart() {
    setStep(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setNeed(false);
  }

  return (
    <section id="niveles" className={`${styles.block} bg-[var(--color-surface)]`}>
      {lead ? <GenericSlotLead section="niveles" title={lead.title} body={lead.body} /> : null}
      <h2 className="text-4xl tracking-tight">{copy.quizTitle}</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-muted-foreground)]">{copy.demoNote}</p>
      <div className={`${styles.progress} mt-6`} aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>
      {done && band ? (
        <div className="mt-8">
          <p className={styles.word}>{band.level}</p>
          <p className="mt-3 text-xl">{band.line}</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{copy.quizResult}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.cta} onClick={() => onLevel(band.level)}>
              {copy.cta}
            </button>
            <button type="button" className={styles.ghost} onClick={restart}>
              {copy.quizRestart}
            </button>
          </div>
        </div>
      ) : question ? (
        <div className="mt-8">
          <p className="text-3xl tracking-tight">{question.q}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={picked === index}
                className={styles.chip}
                onClick={() => {
                  setPicked(index);
                  setNeed(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
          {need ? <p className="mt-3 text-[var(--color-error)]">{copy.quizNeed}</p> : null}
          <button type="button" className={`${styles.cta} mt-6`} onClick={next}>
            {copy.quizNext}
          </button>
        </div>
      ) : null}
    </section>
  );
}
