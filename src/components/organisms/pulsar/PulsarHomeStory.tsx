import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarReveal } from "@/components/organisms/pulsar/PulsarReveal";

export interface PulsarHomeStoryProps {
  dict: Dictionary;
}

const FROM = ["left", "depth", "right"] as const;

const STILLS = [
  "/centrolisto/marketing/presencia-editorial.jpg",
  "/centrolisto/marketing/gestion-editorial.jpg",
  "/centrolisto/moments/family.webp",
] as const;

export function PulsarHomeStory({ dict }: PulsarHomeStoryProps) {
  const copy = dict.pulsar.solutions;

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
          {copy.storyTitle}
        </h2>
        <ol className="mt-12">
          {copy.moments.map((moment, index) => (
            <li
              key={moment.title}
              className="grid items-center gap-8 border-t border-[var(--color-border)] py-12 lg:grid-cols-2 lg:gap-16"
            >
              <PulsarReveal from={FROM[index] ?? "up"}>
                <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]">
                  <Image
                    src={STILLS[index] ?? STILLS[0]}
                    alt={
                      index === 0
                        ? dict.pulsar.solutionSet.presencia.imageAlt
                        : index === 1
                          ? dict.pulsar.solutionSet.gestion.imageAlt
                          : dict.pulsar.commercial.benefits[3].imageAlt
                    }
                    fill
                    sizes="(min-width: 1024px) 36rem, 100vw"
                    className="object-cover"
                  />
                </figure>
              </PulsarReveal>
              <div>
                <p className="font-display text-sm text-[var(--color-muted-foreground)]">0{index + 1}</p>
                <h3 className="mt-2 font-display text-3xl font-medium text-[var(--color-foreground)]">{moment.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-foreground)]">{moment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
