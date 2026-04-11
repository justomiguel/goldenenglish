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
  /** Narrow pill for dense headers (e.g. marketing top bar). */
  variant?: "default" | "compact";
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

export function LanguageSwitcher({
  locale,
  labels,
  variant = "default",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const rest = pathWithoutLocale(pathname);
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-0.5 pl-1 pr-0.5 text-[0.65rem] font-semibold leading-none shadow-sm"
          : "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-2 pr-1 text-xs font-semibold shadow-sm"
      }
      role="navigation"
      aria-label={labels.label}
    >
      {!compact ? (
        <Globe
          className="h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]"
          aria-hidden
          strokeWidth={1.75}
        />
      ) : null}
      {locales.map((loc) => {
        const href = rest === "/" ? `/${loc}` : `/${loc}${rest}`;
        const active = loc === locale;
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc}
            className={
              compact
                ? `inline-flex min-h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 py-1 transition ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                  }`
                : `inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                  }`
            }
            prefetch={false}
          >
            {compact ? null : <LocaleFlag locale={loc} />}
            {loc === "es" ? labels.es : labels.en}
          </Link>
        );
      })}
    </div>
  );
}
