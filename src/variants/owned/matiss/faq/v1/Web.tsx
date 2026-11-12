import { Plus } from "lucide-react";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";

export interface LandingMatissFaqProps {
  title: string;
  items: readonly { q: string; a: string }[];
}

export function LandingMatissFaq({ title, items }: LandingMatissFaqProps) {
  return (
    <MatissReveal preset="section">
      <section id="preguntas" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[2fr_3fr] md:gap-16">
          <h2 className="matiss-display text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
          <div className="matiss-stagger">
            {items.map((item) => (
              <details key={item.q} className="matiss-faq group border-b border-[var(--owned-line)]">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-[var(--ds-color-foreground)] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus className="matiss-faq-icon h-5 w-5 shrink-0 text-[var(--ds-color-primary)]" aria-hidden />
                </summary>
                <p className="pb-5 pe-10 leading-relaxed text-[var(--ds-color-muted-foreground)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MatissReveal>
  );
}

export default LandingMatissFaq;
