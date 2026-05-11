import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export interface MozarthitosRegisterHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
}

const stroke = 2;

export function MozarthitosRegisterHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
}: MozarthitosRegisterHeaderProps) {
  const homeHref = `/${locale}`;

  return (
    <header
      id="top"
      className="mz-site-header sticky top-0 z-50"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
    >
      <div className="mz-site-header-accent w-full shrink-0" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={homeHref} className="mz-header-logo-link min-w-0 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage URLs + /public */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={1024}
            height={303}
            decoding="async"
            fetchPriority="high"
            className="mz-header-logo-img h-9 w-auto max-h-11 max-w-[min(100%,220px)] object-contain sm:h-10 md:max-h-12"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
          <Link
            href={homeHref}
            className="mz-chrome-dash inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-white/50 bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-95" aria-hidden strokeWidth={stroke} />
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </header>
  );
}
