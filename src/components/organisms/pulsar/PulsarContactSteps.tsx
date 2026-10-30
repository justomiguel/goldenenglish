"use client";

import { useState } from "react";

export interface PulsarContactStep {
  step: string;
  title: string;
  body: string;
}

export interface PulsarContactStepsProps {
  title: string;
  steps: readonly PulsarContactStep[];
}

export function PulsarContactSteps({ title, steps }: PulsarContactStepsProps) {
  const [index, setIndex] = useState(0);
  const current = steps[index] ?? steps[0];
  if (!current) return null;

  return (
    <div>
      <h2 className="font-display text-2xl font-medium text-[var(--color-foreground)]">{title}</h2>
      <div className="mt-6 flex gap-2 overflow-x-auto" role="tablist" aria-label={title}>
        {steps.map((item, i) => {
          const selected = i === index;
          return (
            <button
              key={item.step}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-[var(--layout-border-radius)] border px-4 text-sm transition-colors ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              }`}
              onClick={() => setIndex(i)}
            >
              {item.title}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-6 max-w-xl">
        <p className="font-display text-sm text-[var(--color-accent)]">{current.step}</p>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-foreground)]">{current.body}</p>
      </div>
    </div>
  );
}
