import Link from "next/link";
import Image from "next/image";
import { UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

export interface LandingEspacioZenitEnrollmentBannerProps {
  dict: Dictionary;
  locale: string;
  studioPhotoSrc?: string;
}

export function LandingEspacioZenitEnrollmentBanner({
  dict,
  locale,
  studioPhotoSrc,
}: LandingEspacioZenitEnrollmentBannerProps) {
  const brand = "ez" as const;
  const prefix = `/${locale}`;

  return (
    <section
      id="inscripciones"
      className="relative z-[10] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] overflow-hidden bg-black"
      aria-labelledby="ez-mock-enrollment-heading"
    >
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2 lg:gap-0">
        <div className="flex flex-col justify-center gap-6 bg-[#0d3d47] px-[max(1.25rem,env(safe-area-inset-left))] py-12 md:py-16 lg:rounded-l-[28px] lg:px-12">
          <h2
            id="ez-mock-enrollment-heading"
            className="max-w-md text-balance text-2xl font-bold uppercase leading-tight tracking-[0.06em] text-white md:text-3xl lg:text-4xl"
          >
            {marketingLandingCopy(dict, brand, "enrollment.title")}
          </h2>
          <Link
            href={`${prefix}/register`}
            className="inline-flex min-h-[48px] w-fit items-center justify-center gap-2 rounded-xl bg-[var(--ez-cyan)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black shadow-[0_12px_36px_rgb(0_174_239_/30%)] transition hover:bg-[var(--ez-cyan-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3d47]"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            {marketingLandingCopy(dict, brand, "enrollment.cta")}
          </Link>
        </div>
        <div className="relative min-h-[240px] lg:min-h-[320px] lg:rounded-r-[28px]">
          {studioPhotoSrc ? (
            <Image
              src={studioPhotoSrc}
              alt=""
              fill
              className="object-cover lg:rounded-r-[28px]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#111827] via-black to-[#082f49] px-6 lg:rounded-r-[28px]">
              <span className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">
                {marketingLandingCopy(dict, brand, "placeholders.groupPhoto")}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
