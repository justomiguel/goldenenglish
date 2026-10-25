"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";

export interface PublicInstalledTopBarProps {
  homeHref: string;
  logoSrc: string;
  logoAlt: string;
  locale: string;
  localeLabels: LanguageSwitcherLabels;
  localeVariant?: "compact" | "compactDark";
}

/** Logo and language only. The dock owns navigation in the installed app. */
export function PublicInstalledTopBar({
  homeHref,
  logoSrc,
  logoAlt,
  locale,
  localeLabels,
  localeVariant = "compact",
}: PublicInstalledTopBarProps) {
  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link href={homeHref} className="inline-flex min-h-11 items-center" aria-label={logoAlt}>
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- brand URL or bundled mark
          <img src={logoSrc} alt="" className="block h-9 w-auto max-w-[10rem] object-contain object-left" />
        ) : null}
      </Link>
      <LanguageSwitcher locale={locale} labels={localeLabels} variant={localeVariant} />
    </div>
  );
}
