import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import { CalendarDays, Sparkles, Sun } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";

interface MiMundoColoniaSectionProps {
  dict: Dictionary;
  locale: string;
  mediaMap?: LandingMediaMap;
}

export function MiMundoColoniaSection({ dict, locale, mediaMap }: MiMundoColoniaSectionProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const img =
    resolveLandingImageSrcForTheme("mimundo", "niveles", "colonia.jpg", mediaMap) ||
    mimundoSectionImageSrc("niveles", "colonia.jpg");

  return (
    <section
      id="colonia"
      className="mm-section-paper mm-section-decorated scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      <span className="mm-section-blob mm-section-blob--yellow" style={{ inset: "auto auto 10% -6%", width: "340px", height: "340px" }} aria-hidden />
      <MiMundoFloatingDoodles count={5} />

      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="mm-fade-in-up relative flex justify-center md:justify-start">
          <div className="mm-washi relative max-w-md" style={{ "--mm-washi-color": "var(--mm-green)", "--mm-washi-rotate": "-4deg" } as CSSProperties}>
            <div className="overflow-hidden rounded-[24px] border-4 border-white shadow-[var(--mm-shadow-card)]">
              <Image src={img} alt="" width={520} height={390} className="aspect-[4/3] w-full object-cover" sizes="(max-width:768px) 100vw, 480px" />
            </div>
          </div>
        </div>

        <div className="mm-fade-in-up">
          <span className="mm-section-label mm-section-label--pink">{t("colonia.sectionLabel")}</span>
          <h2 className="mt-4 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
            {t("colonia.title")}
          </h2>
          <svg className="mm-scribble-underline" viewBox="0 0 220 14" fill="none" aria-hidden>
            <path d="M 4 8 C 36 2, 64 12, 96 6 S 160 12, 216 4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <p className="mt-5 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("colonia.bodyP1")}</p>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("colonia.bodyP2")}</p>

          <ul className="mt-6 space-y-2 text-sm text-[var(--mm-ink-deep)]">
            <li className="flex items-start gap-2">
              <Sun className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mm-yellow-deep,#f5b800)]" aria-hidden strokeWidth={2.2} />
              {t("colonia.bullet1")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mm-blue)]" aria-hidden strokeWidth={2.2} />
              {t("colonia.bullet2")}
            </li>
          </ul>

          <p className="mt-6 rounded-2xl border border-[var(--mm-green)]/20 bg-white/80 px-4 py-3 text-sm leading-relaxed text-[var(--mm-ink-deep)]">
            {t("colonia.note")}
          </p>

          <Link href={`/${locale}/register`} className="mm-cta-sticker mt-8 inline-flex">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.4} />
            {t("colonia.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
