import Image from "next/image";
import type { CSSProperties } from "react";
import { Building2, HeartHandshake, Sprout } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";

interface MiMundoInstitucionalSectionProps {
  dict: Dictionary;
  mediaMap?: LandingMediaMap;
}

const HIGHLIGHTS = [
  { key: "highlight1", icon: HeartHandshake, color: "var(--mm-pink)" },
  { key: "highlight2", icon: Sprout, color: "var(--mm-green)" },
  { key: "highlight3", icon: Building2, color: "var(--mm-blue)" },
] as const;

export function MiMundoInstitucionalSection({ dict, mediaMap }: MiMundoInstitucionalSectionProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const img =
    resolveLandingImageSrcForTheme("mimundo", "historia", "institucional.jpg", mediaMap) ||
    mimundoSectionImageSrc("historia", "institucional.jpg");

  return (
    <section
      id="institucional"
      className="mm-section-cream mm-section-decorated scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      <span className="mm-section-blob mm-section-blob--blue" style={{ inset: "6% -8% auto auto", width: "300px", height: "300px" }} aria-hidden />
      <MiMundoFloatingDoodles count={4} />

      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="mm-fade-in-up order-2 md:order-1">
          <span className="mm-section-label mm-section-label--blue">{t("institucional.sectionLabel")}</span>
          <h2 className="mt-4 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
            {t("institucional.title")}
          </h2>
          <svg className="mm-scribble-underline" viewBox="0 0 220 14" fill="none" aria-hidden>
            <path d="M 4 8 C 36 2, 64 12, 96 6 S 160 12, 216 4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <p className="mt-5 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("institucional.bodyP1")}</p>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("institucional.bodyP2")}</p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ key, icon: Icon, color }) => (
              <li key={key} className="flex items-start gap-3 text-sm font-semibold text-[var(--mm-ink-deep)]">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--mm-shadow-card)]"
                  style={{ color }}
                >
                  <Icon className="h-4 w-4" aria-hidden strokeWidth={2.2} />
                </span>
                {t(`institucional.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="mm-fade-in-up relative order-1 flex justify-center md:order-2 md:justify-end">
          <div className="mm-washi relative max-w-md" style={{ "--mm-washi-color": "var(--mm-yellow)", "--mm-washi-rotate": "3deg" } as CSSProperties}>
            <div className="overflow-hidden rounded-[24px] border-4 border-white shadow-[var(--mm-shadow-card)]">
              <Image src={img} alt="" width={520} height={390} className="aspect-[4/3] w-full object-cover" sizes="(max-width:768px) 100vw, 480px" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
