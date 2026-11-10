"use client";

import { useState } from "react";
import type { LandingMatissFaqProps } from "@/components/organisms/LandingMatissFaq";

export function LandingMatissFaqPhone({ title, items }: LandingMatissFaqProps) {
  const [open, setOpen] = useState(0);
  const current = items[open];

  return (
    <section id="preguntas" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-8 pe-[max(1.5rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-6xl">
        <h2 className="matiss-display text-3xl text-[var(--matiss-ink)]">{title}</h2>
        <ul className="mt-4">
          {items.map((item, index) => (
            <li key={item.q} className="border-b border-[var(--matiss-line)]">
              <button
                type="button"
                aria-expanded={index === open}
                className="flex min-h-[44px] w-full items-center text-left text-sm font-semibold text-[var(--matiss-ink)]"
                onClick={() => setOpen(index)}
              >
                {item.q}
              </button>
            </li>
          ))}
        </ul>
        {current ? <p className="mt-4 leading-relaxed text-[var(--matiss-ink-soft)]">{current.a}</p> : null}
      </div>
    </section>
  );
}
