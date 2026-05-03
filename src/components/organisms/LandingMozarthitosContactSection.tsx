import Link from "next/link";
import { Images, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

export interface LandingMozarthitosContactSectionProps {
  dict: Dictionary;
  igUrl: string;
  marketingBrand?: MarketingLandingBrand;
}

export function LandingMozarthitosContactSection({
  dict,
  igUrl,
  marketingBrand = "mz",
}: LandingMozarthitosContactSectionProps) {
  const phoneDisplay = marketingLandingCopy(
    dict,
    marketingBrand,
    "contact.phoneDisplay",
  );
  const phoneHref =
    marketingBrand === "mz"
      ? "https://wa.me/56959916314"
      : `tel:${phoneDisplay.replace(/[^\d+]/gu, "").trim() || "#"}`;
  return (
    <section
      id="contacto"
      className="mz-contact-surface relative z-[13] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] -mt-8 rounded-t-[28px] px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-12 shadow-[0_-20px_50px_rgb(0_0_0_/14%)] sm:-mt-10 sm:rounded-t-[36px] md:-mt-14 md:rounded-t-[48px] md:pb-24 md:pt-20 lg:px-6"
    >
      <div className="relative z-[2] mx-auto grid max-w-6xl gap-10 sm:gap-12 md:grid-cols-2 md:gap-20">
        <MozarthitosReveal preset="contactColLeft" className="min-w-0 space-y-6 sm:space-y-8">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.22em]">
              {marketingLandingCopy(dict, marketingBrand, "nav.contacto")}
            </p>
            <h2 className="mz-section-heading mt-2 text-balance text-[clamp(1.75rem,4vw+0.75rem,3.25rem)] md:text-5xl">
              {marketingLandingCopy(dict, marketingBrand, "contact.title")}
            </h2>
            <p className="mt-3 text-base text-white/90 sm:mt-4 sm:text-lg">
              {marketingLandingCopy(dict, marketingBrand, "contact.subtitle")}
            </p>
          </div>
          <Link
            href={phoneHref}
            className="inline-flex min-h-[48px] flex-wrap items-center gap-2 break-all text-base font-semibold text-white underline-offset-4 hover:underline sm:break-normal sm:text-lg"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-5 w-5 shrink-0 text-white" aria-hidden />
            {phoneDisplay}
          </Link>
          <div className="space-y-3">
            <p className="text-base font-semibold text-white/95">
              {marketingLandingCopy(dict, marketingBrand, "contact.instagramTitle")}
            </p>
            {igUrl ? (
              <Link
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[var(--mz-white)] px-6 py-3 text-sm font-bold text-[var(--mz-pink)] shadow-[0_10px_26px_rgb(0_0_0_/18%)] transition-colors hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mz-yellow)] sm:w-auto"
              >
                <Images className="h-4 w-4 shrink-0" aria-hidden />
                {marketingLandingCopy(dict, marketingBrand, "contact.instagramCta")}
              </Link>
            ) : null}
          </div>
        </MozarthitosReveal>
        <MozarthitosReveal preset="contactColRight">
          <div className="mz-contact-hint-card p-5 text-sm leading-relaxed text-white sm:p-7 md:p-9 md:text-base">
            <p>{marketingLandingCopy(dict, marketingBrand, "contact.formHint")}</p>
          </div>
        </MozarthitosReveal>
      </div>
    </section>
  );
}
