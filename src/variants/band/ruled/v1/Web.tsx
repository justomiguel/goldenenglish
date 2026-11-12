import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { BandPhoto } from "@/variants/band/BandPhoto";
import type { BandVariantProps } from "@/variants/band/bandProps";

export default function BandRuled({ items }: BandVariantProps) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8" data-bands-layout="ruled">
      {items.map((band, index) => (
        <GenericLandingMotion key={band.id} index={index}>
          <article id={band.id} className="grid items-center gap-5 border-t border-[var(--color-border)] py-8 sm:grid-cols-[9rem_1fr]">
            <BandPhoto src={band.src} alt={band.sentence} className="h-24 w-full object-cover" />
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="text-2xl font-medium tracking-tight">{band.label}</h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
            </div>
          </article>
        </GenericLandingMotion>
      ))}
    </section>
  );
}
