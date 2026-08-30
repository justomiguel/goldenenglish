import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export interface NagoRegisterHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
}

const stroke = 2;

export function NagoRegisterHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
}: NagoRegisterHeaderProps) {
  const homeHref = `/${locale}`;

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--nago-gold)]/25 bg-black"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] pt-1 pb-0 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={homeHref} className="min-w-0 shrink-0 leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage URLs + local */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={918}
            height={554}
            decoding="async"
            fetchPriority="high"
            className="nago-logo-knockout block h-[4.5rem] w-auto max-w-[14rem] object-contain object-left sm:h-[5.25rem] sm:max-w-[17rem]"
          />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
          <Link
            href={homeHref}
            className="nago-btn px-3 py-2 text-xs sm:text-[13px]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-95" aria-hidden strokeWidth={stroke} />
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </header>
  );
}
