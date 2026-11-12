import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { BandPhoto } from "@/variants/band/BandPhoto";
import type { BandVariantProps } from "@/variants/band/bandProps";

export default function BandAlternate({ items }: BandVariantProps) {
  return (
    <section data-bands-layout="alternate">
      {items.map((band, index) => (
        <GenericLandingMotion key={band.id} index={index}>
          <article id={band.id} className="grid min-h-[68vh] lg:grid-cols-2">
            <BandPhoto
              src={band.src}
              alt={band.sentence}
              className={`h-72 w-full object-cover lg:h-full ${index % 2 === 1 ? "lg:order-2" : ""}`}
            />
            <div className="flex flex-col justify-center px-5 py-14 sm:px-12">
              <h2 className="text-3xl font-medium tracking-tight">{band.label}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
            </div>
          </article>
        </GenericLandingMotion>
      ))}
    </section>
  );
}
