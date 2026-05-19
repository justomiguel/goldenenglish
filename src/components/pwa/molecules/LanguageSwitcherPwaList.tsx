"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import {
  defaultLocale,
  locales,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { LocaleFlag } from "@/components/atoms/LocaleFlag";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";

interface LanguageSwitcherPwaListProps {
  locale: string;
  labels: LanguageSwitcherLabels;
}

function pathWithoutLocale(pathname: string): string {
  for (const loc of locales) {
    const prefix = `/${loc}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || "/";
    }
  }
  return pathname;
}

function labelForLocale(labels: LanguageSwitcherLabels, loc: AppLocale): string {
  switch (loc) {
    case "es":
      return labels.es;
    case "en":
      return labels.en;
    case "pt":
      return labels.pt;
    default:
      return loc;
  }
}

export function LanguageSwitcherPwaList({ locale, labels }: LanguageSwitcherPwaListProps) {
  const pathname = usePathname();
  const rest = pathWithoutLocale(pathname);
  const active = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  const hrefFor = (loc: AppLocale) =>
    rest === "/" ? `/${loc}` : `/${loc}${rest}`;

  return (
    <nav aria-label={labels.label}>
      <ul className="m-0 divide-y divide-[var(--color-border)] p-0">
        {locales.map((loc) => {
          const isActive = loc === active;
          return (
            <li key={loc}>
              <Link
                href={hrefFor(loc)}
                aria-current={isActive ? "true" : undefined}
                className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-3 active:bg-[var(--color-muted)]/50"
              >
                <span className="inline-flex items-center gap-2.5 text-sm font-medium text-[var(--color-foreground)]">
                  <LocaleFlag locale={loc} />
                  {labelForLocale(labels, loc)}
                </span>
                {isActive ? (
                  <Check className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
