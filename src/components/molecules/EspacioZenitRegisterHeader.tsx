import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export interface EspacioZenitRegisterHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  brandDisplayName: string;
  dict: Dictionary;
}

const stroke = 2;

/** Cabecera oscura cyan (marca + inicio + idioma) para inscripción Espacio Zenit. */
export function EspacioZenitRegisterHeader({
  locale,
  logoSrc,
  logoAlt,
  brandDisplayName,
  dict,
}: EspacioZenitRegisterHeaderProps) {
  const homeHref = `/${locale}`;
  const bypassOptimizer = logoSrc.startsWith("/images/");

  return (
    <header
      className="border-b border-[rgb(0_174_239_/35%)] bg-black px-[max(1rem,env(safe-area-inset-left))] py-4 pe-[max(1rem,env(safe-area-inset-right))] shadow-[0_12px_40px_rgb(0_0_0_/55%)]"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link
          href={homeHref}
          className="ez-mock-brand-link flex min-h-[44px] min-w-0 shrink-0 items-center gap-3 text-left no-underline"
        >
          <Image
            src={logoSrc}
            alt={logoAlt || brandDisplayName}
            width={48}
            height={48}
            unoptimized={bypassOptimizer}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-[var(--ez-cyan)] bg-black object-contain p-1 md:h-12 md:w-12"
          />
          <span className="truncate text-sm font-bold uppercase tracking-[0.12em] text-white md:text-base">
            {brandDisplayName}
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
          <Link
            href={homeHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-white/18 sm:text-xs"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-95" aria-hidden strokeWidth={stroke} />
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </header>
  );
}
