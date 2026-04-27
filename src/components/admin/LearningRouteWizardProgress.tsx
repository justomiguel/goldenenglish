import type { Dictionary } from "@/types/i18n";

interface LearningRouteWizardProgressProps {
  activeStep: 1 | 2;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function LearningRouteWizardProgress({
  activeStep,
  labels,
}: LearningRouteWizardProgressProps) {
  const steps = [
    { number: 1, title: labels.routeWizardStepDetails, description: labels.routeWizardStepDetailsDescription },
    { number: 2, title: labels.routeWizardStepGraph, description: labels.routeWizardStepGraphDescription },
  ] as const;
  return (
    <ol className="grid gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-2">
      {steps.map((step) => {
        const isActive = step.number === activeStep;
        return (
          <li
            key={step.number}
            className={`rounded-[var(--layout-border-radius)] border p-3 ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-background)]"
                : "border-[var(--color-border)] bg-[var(--color-muted)]"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {labels.routeWizardStepLabel} {step.number}
            </span>
            <p className="mt-1 font-semibold text-[var(--color-foreground)]">{step.title}</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
