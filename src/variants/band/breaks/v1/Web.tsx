import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { BandPhoto } from "@/variants/band/BandPhoto";
import type { BandVariantProps } from "@/variants/band/bandProps";

export default function BandBreaks({ items }: BandVariantProps) {
  return (
    <section data-bands-layout="breaks">
      {items.map((band, index) => (
        <GenericLandingMotion key={band.id} index={index}>
          <figure id={band.id}>
            <BandPhoto src={band.src} alt={band.sentence} className="h-[42vh] w-full object-cover" />
            <figcaption className="mx-auto max-w-xl px-5 py-8">
              <h2 className="text-3xl font-medium tracking-tight">{band.label}</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
            </figcaption>
          </figure>
        </GenericLandingMotion>
      ))}
    </section>
  );
}
