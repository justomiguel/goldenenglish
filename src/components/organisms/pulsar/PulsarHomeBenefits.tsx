import Image from "next/image";
import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeBenefitsProps {
  dict: Dictionary;
}

const STILLS = [
  "/centrolisto/moments/sunday.webp",
  "/centrolisto/hero-desk.webp",
  "/centrolisto/moments/class.webp",
  "/centrolisto/moments/family.webp",
] as const;

export function PulsarHomeBenefits({ dict }: PulsarHomeBenefitsProps) {
  const benefits = dict.pulsar.commercial.benefits;

  return (
    <section className="border-b border-[var(--color-border)] py-14 md:py-20">
      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
        {benefits.map((benefit, index) => {
          const flipped = index % 2 === 1;
          return (
            <article key={benefit.title} className="grid items-center gap-8 lg:grid-cols-2">
              <div className={flipped ? "lg:order-2" : undefined}>
                <h2 className="max-w-md font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
                  {benefit.title}
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-foreground)]">{benefit.body}</p>
              </div>
              <figure className={`relative aspect-[4/3] overflow-hidden ${flipped ? "lg:order-1" : ""}`}>
                <Image
                  src={STILLS[index] ?? STILLS[0]}
                  alt={benefit.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 36rem, 100vw"
                  className="object-cover"
                />
              </figure>
            </article>
          );
        })}
      </div>
    </section>
  );
}
