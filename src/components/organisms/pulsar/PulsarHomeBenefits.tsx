"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";

export interface PulsarHomeBenefitsProps {
  dict: Dictionary;
}

const STILL: Record<string, { src: string; position: string }> = {
  inscripciones: { src: "/centrolisto/product/public-site.jpg", position: "object-cover object-top" },
  cobros: { src: "/centrolisto/product/admin-hub.jpg", position: "object-cover object-[center_60%]" },
  clases: { src: "/centrolisto/product/admin-hub.jpg", position: "object-cover object-left" },
  familias: { src: "/centrolisto/product/public-site.jpg", position: "object-cover object-center" },
};

export function PulsarHomeBenefits({ dict }: PulsarHomeBenefitsProps) {
  const copy = dict.pulsar.solutions.connected;
  const [active, setActive] = useState(0);
  const item = copy.items[active] ?? copy.items[0];
  const still = STILL[item?.id ?? ""] ?? STILL.inscripciones;

  if (!item) return null;

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="max-w-xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
            {copy.title}
          </h2>
          <div role="tablist" aria-label={copy.title} className="mt-8 flex flex-col gap-2">
            {copy.items.map((entry, index) => {
              const selected = index === active;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  id={`cl-benefit-${entry.id}`}
                  aria-selected={selected}
                  aria-controls="cl-benefit-panel"
                  data-cl-event="cl_product_demo"
                  data-cl-detail={entry.id}
                  className={`min-h-11 rounded-[var(--layout-border-radius)] px-4 py-3 text-left transition-colors ${
                    selected
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  }`}
                  onClick={() => setActive(index)}
                >
                  <span className="block text-base font-medium">{entry.title}</span>
                  {selected ? <span className="mt-1 block text-sm leading-relaxed">{entry.body}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div role="tabpanel" id="cl-benefit-panel" aria-labelledby={`cl-benefit-${item.id}`}>
          <PulsarBrowserShot src={still.src} alt={item.title} imageClassName={still.position} />
        </div>
      </div>
    </section>
  );
}
