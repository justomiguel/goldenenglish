import Link from "next/link";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { PublicHeaderAccountCta } from "@/components/molecules/PublicHeaderAccountCta";
import {
  PUBLIC_MARKETING_CHROME_CLASS,
  publicExperienceLocaleVariant,
  type PublicExperienceVariant,
} from "@/lib/theme/publicExperienceNav";
import type { Dictionary } from "@/types/i18n";

export interface PublicFlowHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  tone: PublicExperienceVariant;
}

/** Compact public header for payments, surveys, and share pages. */
export function PublicFlowHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
  sessionEmail,
  tone,
}: PublicFlowHeaderProps) {
  return (
    <header
      className={`${PUBLIC_MARKETING_CHROME_CLASS} sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-2 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={logoAlt}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- brand URL or bundled mark
            <img src={logoSrc} alt="" className="block h-9 w-auto max-w-[10rem] object-contain object-left" />
          ) : null}
        </Link>
        <div className="flex items-center gap-2">
          <PublicHeaderAccountCta
            locale={locale}
            sessionEmail={sessionEmail}
            loginLabel={dict.nav.login}
            loginShort={dict.nav.loginShort}
            portalLabel={dict.nav.myPortal}
            logoutLabel={dict.nav.logout}
            tone={tone}
          />
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant={publicExperienceLocaleVariant(tone)}
          />
        </div>
      </div>
    </header>
  );
}
