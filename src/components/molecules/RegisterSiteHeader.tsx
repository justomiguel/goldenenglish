import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

interface RegisterSiteHeaderProps {
  brand: BrandPublic;
  locale: string;
  dict: Dictionary;
}

/** Marca (logo + nombre) y acceso al inicio, alineado al login desktop. */
export function RegisterSiteHeader({
  brand,
  locale,
  dict,
}: RegisterSiteHeaderProps) {
  const homeHref = `/${locale}`;
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");

  return (
    <header className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={homeHref}
        className="group flex min-w-0 items-center gap-3 rounded-[var(--layout-border-radius)] outline-none ring-[var(--color-primary)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-white p-1.5 shadow-sm ring-1 ring-[var(--color-border)] transition group-hover:ring-[var(--color-accent)]/50 sm:p-2">
          <Image
            src={brand.logoPath}
            alt={brand.logoAlt || brand.name}
            width={48}
            height={48}
            unoptimized={bypassLogoOptimizer}
            className="block h-8 w-8 rounded-[var(--layout-border-radius)] object-contain sm:h-9 sm:w-9"
            priority
          />
        </div>
        <span className="font-display truncate text-lg font-semibold tracking-tight text-[var(--color-primary)] sm:text-xl">
          {brand.name}
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] px-2.5 py-2 text-sm font-semibold text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3"
        >
          <ArrowLeft
            className="h-4 w-4 shrink-0 opacity-80"
            aria-hidden
            strokeWidth={2}
          />
          {dict.nav.home}
        </Link>
        <LanguageSwitcher locale={locale} labels={dict.common.locale} />
      </div>
    </header>
  );
}
