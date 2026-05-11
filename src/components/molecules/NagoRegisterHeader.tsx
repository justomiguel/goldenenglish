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
      className="sticky top-0 z-50 border-b border-[var(--nago-green-light)]/35 bg-white/96 shadow-sm backdrop-blur-md"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={homeHref} className="min-w-0 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage URLs + local */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={360}
            height={108}
            decoding="async"
            fetchPriority="high"
            className="h-16 w-auto max-h-[4.75rem] max-w-[260px] object-contain sm:h-[5rem] md:max-w-[300px]"
          />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compact"
          />
          <Link
            href={homeHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--nago-green)]/45 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--nago-green)] transition-colors hover:bg-[var(--nago-green)]/10 sm:text-[13px]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-95" aria-hidden strokeWidth={stroke} />
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </header>
  );
}
