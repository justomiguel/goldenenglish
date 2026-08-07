import type { AssessmentPathStep } from "@/lib/academics/assessmentGradingPath";

export type AssessmentGradingPathStripProps = {
  currentStep: AssessmentPathStep;
  labels: {
    stepCreate: string;
    stepStudent: string;
    stepGrade: string;
    stepPublish: string;
    stripAria: string;
    countsLine?: string;
  };
  countsText?: string | null;
};

type PathVisualState = "done" | "current" | "future";

function resolvePathVisualState(stepNumber: AssessmentPathStep, currentStep: AssessmentPathStep): PathVisualState {
  if (stepNumber < currentStep) return "done";
  if (stepNumber === currentStep) return "current";
  return "future";
}

function pathStateClassName(state: PathVisualState): string {
  switch (state) {
    case "done":
      return "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]";
    case "current":
      return "border-2 border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-foreground)]";
    case "future":
      return "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]";
  }
}

export function AssessmentGradingPathStrip({
  currentStep,
  labels,
  countsText,
}: AssessmentGradingPathStripProps) {
  const steps = [
    { number: 1 as const, label: labels.stepCreate },
    { number: 2 as const, label: labels.stepStudent },
    { number: 3 as const, label: labels.stepGrade },
    { number: 4 as const, label: labels.stepPublish },
  ];

  return (
    <div className="sticky top-0 z-10 space-y-2 bg-[var(--color-background)] py-2">
      <ol
        aria-label={labels.stripAria}
        className="m-0 flex list-none flex-wrap items-center gap-2 p-0"
      >
        {steps.map((step, index) => {
          const state = resolvePathVisualState(step.number, currentStep);
          return (
            <li
              key={step.number}
              aria-label={step.label}
              data-path-state={state}
              className="flex items-center gap-2"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="text-[var(--color-muted-foreground)]"
                >
                  →
                </span>
              ) : null}
              <span
                className={`rounded-[var(--layout-border-radius)] px-3 py-1 text-sm font-medium ${pathStateClassName(state)}`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {countsText ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{countsText}</p>
      ) : null}
    </div>
  );
}
