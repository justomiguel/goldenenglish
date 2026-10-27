import type { ReactNode } from "react";

interface EventRegisterStepProps {
  step: string;
  title: string;
  lead: string;
  children: ReactNode;
}

export function EventRegisterStep({ step, title, lead, children }: EventRegisterStepProps) {
  return (
    <section className="space-y-4" aria-labelledby={`event-register-step-${step}`}>
      <header className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-[var(--color-primary-foreground)]">
          {step}
        </span>
        <span className="min-w-0 pt-0.5">
          <h2
            id={`event-register-step-${step}`}
            className="text-lg font-semibold text-[var(--color-foreground)]"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
        </span>
      </header>
      <div className="space-y-4 border-l-2 border-[var(--color-border)] pl-4 sm:ml-4 sm:pl-6">
        {children}
      </div>
    </section>
  );
}
