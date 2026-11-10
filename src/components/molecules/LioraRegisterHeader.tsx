import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { PublicHeaderAccountCta } from "@/components/molecules/PublicHeaderAccountCta";
import { PUBLIC_MARKETING_CHROME_CLASS } from "@/lib/theme/publicExperienceNav";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LioraLockup } from "@/components/molecules/LioraLockup";

export interface LioraRegisterHeaderProps {
  locale: string;
  /** Brand name from the brand layer; drawn as the horizontal lockup. */
  brandName: string;
  /** Accessible name of the home link. */
  logoAlt: string;
  dict: Dictionary;
  sessionEmail?: string | null;
}

const stroke = 1.5;

export function LioraRegisterHeader({
  locale,
  brandName,
  logoAlt,
  dict,
  sessionEmail = null,
}: LioraRegisterHeaderProps) {
  const homeHref = `/${locale}`;

  return (
    <header
      className={`${PUBLIC_MARKETING_CHROME_CLASS} sticky top-0 z-50 border-b border-[var(--liora-line)] bg-[color-mix(in_srgb,var(--liora-cream)_95%,transparent)] backdrop-blur-md`}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={homeHref} className="min-w-0 shrink-0" aria-label={logoAlt}>
          <LioraLockup
            brandName={brandName}
            motto={marketingLandingCopy(dict, "liora", "chrome.motto").trim()}
          />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <PublicHeaderAccountCta
            locale={locale}
            sessionEmail={sessionEmail}
            loginLabel={dict.nav.login}
            loginShort={dict.nav.loginShort}
            portalLabel={dict.nav.myPortal}
            logoutLabel={dict.nav.logout}
            tone="liora"
          />
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compact"
          />
          <Link
            href={homeHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--liora-rose-deep)]/45 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--liora-rose-text)] transition-colors hover:bg-[var(--liora-blush)]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </header>
  );
}
