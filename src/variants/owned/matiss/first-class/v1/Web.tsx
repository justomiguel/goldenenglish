import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";

export interface LandingMatissFirstClassProps {
  title: string;
  steps: readonly { title: string; body: string }[];
  buttonHref?: string;
  buttonLabel: string;
}

export function LandingMatissFirstClass({ title, steps, buttonHref, buttonLabel }: LandingMatissFirstClassProps) {
  return (
    <MatissReveal preset="steps">
      <section className="px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28" aria-labelledby="matiss-first-class-title">
        <div className="mx-auto max-w-6xl">
          <h2 id="matiss-first-class-title" className="matiss-display max-w-xl text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
          <ol className="matiss-stagger mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="matiss-display block text-7xl leading-none text-[var(--owned-violet)]" aria-hidden>
                  {index + 1}
                </span>
                <span className="matiss-line mt-5 block h-px w-full bg-[var(--owned-line)]" aria-hidden />
                <p className="matiss-display mt-5 text-2xl text-[var(--ds-color-foreground)]">{step.title}</p>
                <p className="mt-2 leading-relaxed text-[var(--ds-color-muted-foreground)]">{step.body}</p>
              </li>
            ))}
          </ol>
          {buttonHref ? (
            <Link href={buttonHref} className="matiss-btn mt-12 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[var(--ds-color-primary)] px-7 text-sm font-semibold text-white hover:bg-[var(--owned-violet-hover)]">
              <Sparkles className="h-4 w-4" aria-hidden />
              {buttonLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </MatissReveal>
  );
}

export default LandingMatissFirstClass;
