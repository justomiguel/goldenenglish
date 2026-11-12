"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { LandingMatissFaqProps } from "@/variants/owned/matiss/faq/v1/Web";

export function LandingMatissFaqPhone({ title, items }: LandingMatissFaqProps) {
  const [open, setOpen] = useState(0);

  return (
    <section id="preguntas" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-8 pe-[max(1.5rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-6xl">
        <h2 className="matiss-display text-3xl text-[var(--ds-color-foreground)]">{title}</h2>
        <ul className="mt-4">
          {items.map((item, index) => {
            const isOpen = index === open;
            return (
              <li key={item.q} className="border-b border-[var(--owned-line)]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[var(--ds-color-foreground)]"
                  onClick={() => setOpen(index)}
                >
                  {item.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--ds-color-primary)] transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isOpen ? <p className="pb-3 leading-relaxed text-[var(--ds-color-muted-foreground)]">{item.a}</p> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default LandingMatissFaqPhone;
