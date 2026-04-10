"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { locales } from "@/lib/i18n/dictionaries";
import { LocaleFlag } from "@/components/atoms/LocaleFlag";

export interface LanguageSwitcherLabels {
  label: string;
  es: string;
  en: string;
}

interface LanguageSwitcherProps {
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

export function LanguageSwitcher({ locale, labels }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const rest = pathWithoutLocale(pathname);

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-2 pr-1 text-xs font-semibold shadow-sm"
      role="navigation"
      aria-label={labels.label}
    >
      <Globe
        className="h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]"
        aria-hidden
        strokeWidth={1.75}
      />
      {locales.map((loc) => {
        const href = rest === "/" ? `/${loc}` : `/${loc}${rest}`;
        const active = loc === locale;
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
            }`}
            prefetch={false}
          >
            <LocaleFlag locale={loc} />
            {loc === "es" ? labels.es : labels.en}
          </Link>
        );
      })}
    </div>
  );
}
