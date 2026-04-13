"use client";

import type { RubricDimensionDef } from "@/types/rubricDimensions";
import type { Dictionary } from "@/types/i18n";
import { suggestedScoreForGrading } from "@/lib/academics/rubricSuggestedScoreFromDimensions";
import { QuickFeedbackChips } from "@/components/molecules/QuickFeedbackChips";
import { Button } from "@/components/atoms/Button";

export interface GradingFormProps {
  maxScore: number;
  dimensions: RubricDimensionDef[];
  rubric: Record<string, number>;
  setRubric: (next: Record<string, number>) => void;
  scoreStr: string;
  setScoreStr: (v: string) => void;
  scoreLocked: boolean;
  setScoreLocked: (v: boolean) => void;
  feedback: string;
  setFeedback: (v: string) => void;
  onInsertFeedback: (phrase: string) => void;
  rubricDict: Pick<
    Dictionary["dashboard"]["teacherAssessmentMatrix"]["rubric"],
    "scoreLabel" | "autoHint" | "syncFromRubric" | "feedbackLabel"
  >;
  chipDict: Dictionary["dashboard"]["teacherAssessmentMatrix"]["chips"];
}

function span(d: RubricDimensionDef): number {
  return Math.max(1, d.scaleMax - d.scaleMin + 1);
}

export function GradingForm({
  maxScore,
  dimensions,
  rubric,
  setRubric,
  scoreStr,
  setScoreStr,
  scoreLocked,
  setScoreLocked,
  feedback,
  setFeedback,
  onInsertFeedback,
  rubricDict,
  chipDict,
}: GradingFormProps) {
  const autoScore = suggestedScoreForGrading(rubric, dimensions, maxScore);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {dimensions.map((d) => {
          const v = rubric[d.key] ?? d.scaleMin;
          const useToggle = span(d) <= 5;
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-foreground)]">{d.label}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {v}/{d.scaleMax}
                </span>
              </div>
              {useToggle ? (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label={d.label}
                >
                  {Array.from({ length: span(d) }, (_, i) => d.scaleMin + i).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`min-h-[44px] min-w-[44px] rounded-[var(--layout-border-radius)] border px-2 text-sm font-medium transition-colors ${
                        v === n
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                      }`}
                      aria-pressed={v === n}
                      onClick={() => {
                        const next = { ...rubric, [d.key]: n };
                        setRubric(next);
                        if (!scoreLocked) {
                          const s = suggestedScoreForGrading(next, dimensions, maxScore);
                          if (s != null) setScoreStr(String(s));
                        }
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="range"
                  min={d.scaleMin}
                  max={d.scaleMax}
                  step={1}
                  className="w-full accent-[var(--color-primary)]"
                  value={v}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    const next = { ...rubric, [d.key]: num };
                    setRubric(next);
                    if (!scoreLocked) {
                      const s = suggestedScoreForGrading(next, dimensions, maxScore);
                      if (s != null) setScoreStr(String(s));
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[120px] flex-1 space-y-1">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-score-override">
            {rubricDict.scoreLabel}
            {autoScore != null ? (
              <span className="ml-2 text-xs font-normal text-[var(--color-muted-foreground)]">
                {rubricDict.autoHint.replace("{value}", String(autoScore))}
              </span>
            ) : null}
          </label>
          <input
            id="grade-score-override"
            type="number"
            min={0}
            max={maxScore}
            step={0.5}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={scoreStr}
            onChange={(e) => {
              setScoreLocked(true);
              setScoreStr(e.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px]"
          onClick={() => {
            setScoreLocked(false);
            const s = suggestedScoreForGrading(rubric, dimensions, maxScore);
            if (s != null) setScoreStr(String(s));
          }}
        >
          {rubricDict.syncFromRubric}
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-feedback">
          {rubricDict.feedbackLabel}
        </label>
        <textarea
          id="grade-feedback"
          rows={4}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={8000}
        />
        <QuickFeedbackChips chips={chipDict.phrases} onInsert={onInsertFeedback} dict={{ aria: chipDict.aria }} />
      </div>
    </div>
  );
}
