import Image from "next/image";
import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeStartProps {
  dict: Dictionary;
}

export function PulsarHomeStart({ dict }: PulsarHomeStartProps) {
  const copy = dict.pulsar.home;

  return (
    <section className="border-b border-[var(--color-border)] py-12 md:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.startTitle}
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.startLead}
          </p>
          <ol className="mt-6 max-w-2xl border-l border-[var(--color-primary)]">
            {dict.pulsar.contact.steps.map((step) => (
              <li key={step.step} className="py-4 pl-6">
                <p className="font-display text-sm text-[var(--color-accent)]">{step.step}</p>
                <h3 className="mt-2 font-display text-xl font-medium text-[var(--color-foreground)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <figure className="lg:col-span-5">
          <Image
            src="/centrolisto/moments/class.webp"
            alt={copy.startTitle}
            width={1280}
            height={720}
            className="aspect-video w-full rounded-lg border border-[var(--color-border)] object-cover"
          />
        </figure>
      </div>
    </section>
  );
}
