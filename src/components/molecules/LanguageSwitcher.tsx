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
  variant?: "default" | "compact" | "compactDark";
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
  const compactDark = variant === "compactDark";
  const compact = variant === "compact" || compactDark;

  return (
    <div
      className={
        compactDark
          ? "inline-flex items-center gap-0 rounded-full border border-white/50 bg-black/35 py-0.5 pl-1 pr-0.5 text-[0.65rem] font-semibold leading-none shadow-[0_2px_12px_rgb(0_0_0_/22%),inset_0_1px_0_rgb(255_255_255_/14%)] backdrop-blur-sm"
          : compact
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
              compactDark
                ? `inline-flex min-h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    active
                      ? "bg-[var(--mz-yellow)] font-bold text-[var(--mz-ink-on-white)] shadow-md"
                      : "text-white/92 hover:bg-white/14 hover:text-white"
                  }`
                : compact
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
