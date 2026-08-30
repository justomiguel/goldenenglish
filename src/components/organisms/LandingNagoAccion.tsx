import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";

const THUMBS = [
  NAGO_TEMPLATE.gal01,
  NAGO_TEMPLATE.gal02,
  NAGO_TEMPLATE.gal03,
  NAGO_TEMPLATE.gal04,
] as const;

export function LandingNagoAccion({ dict }: { dict: Dictionary }) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section className="px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))] pb-4 pt-10">
      <div className="mx-auto max-w-7xl">
        <NagoReveal>
          <h2 className="nago-display text-2xl text-[var(--nago-heading-solid)] md:text-3xl">
            {t("accion.sectionTitle")}
          </h2>
        </NagoReveal>
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {THUMBS.map((src, i) => (
            <NagoReveal
              key={src}
              variant="media"
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
              </div>
            </NagoReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
