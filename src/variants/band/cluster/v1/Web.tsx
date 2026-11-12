import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { BandPhoto } from "@/variants/band/BandPhoto";
import type { BandVariantProps } from "@/variants/band/bandProps";

export default function BandCluster({ items }: BandVariantProps) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <section data-bands-layout="cluster">
      <GenericLandingMotion>
        <figure id={first.id}>
          <BandPhoto src={first.src} alt={first.sentence} className="h-[62vh] w-full object-cover" />
          <figcaption className="mx-auto max-w-xl px-5 py-8">
            <h2 className="text-3xl font-medium tracking-tight">{first.label}</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">{first.sentence}</p>
          </figcaption>
        </figure>
      </GenericLandingMotion>
      <div className="grid md:grid-cols-2">
        {rest.map((band, index) => (
          <GenericLandingMotion key={band.id} index={index}>
            <figure id={band.id}>
              <BandPhoto src={band.src} alt={band.sentence} className="h-64 w-full object-cover" />
              <figcaption className="px-5 py-6">
                <h2 className="text-2xl font-medium tracking-tight">{band.label}</h2>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
              </figcaption>
            </figure>
          </GenericLandingMotion>
        ))}
      </div>
    </section>
  );
}
