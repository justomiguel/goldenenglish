import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export interface MiMundoRegisterHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
}

const stroke = 1.85;

export function MiMundoRegisterHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
}: MiMundoRegisterHeaderProps) {
  const homeHref = `/${locale}`;
  const backHome = marketingLandingCopy(dict, "mm", "register.backHome").trim();

  return (
    <header
      id="top"
      className="mm-register-header sticky top-0 z-50 border-b border-[var(--mm-green)]/20 bg-[var(--mm-cream)]/95"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pe-[max(1rem,env(safe-area-inset-right))] sm:py-3 md:gap-3 lg:gap-4 lg:py-4">
        <Link
          href={homeHref}
          className="min-w-0 shrink-0"
          aria-label={logoAlt}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- supports Storage + /public */}
          <img
            src={logoSrc}
            alt=""
            width={360}
            height={108}
            decoding="async"
            fetchPriority="high"
            className="h-14 w-auto max-w-[200px] object-contain sm:h-16 sm:max-w-[240px] md:h-[4.75rem] md:max-w-[280px]"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compact"
          />
          <Link
            href={homeHref}
            className="mm-register-back inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--mm-green)]/40 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--mm-green)] shadow-sm transition hover:bg-[var(--mm-green)]/10"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0"
              aria-hidden
              strokeWidth={stroke}
            />
            <span className="hidden sm:inline">{backHome}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
