"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  defaultLocale,
  locales,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { LocaleFlag } from "@/components/atoms/LocaleFlag";
import { useBlogArticleLocaleHrefs } from "@/components/blog/BlogArticleLocaleHrefProvider";

export interface LanguageSwitcherLabels {
  label: string;
  es: string;
  en: string;
  pt: string;
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

function trackClasses(variant: LanguageSwitcherProps["variant"]): string {
  if (variant === "compactDark") {
    return [
      "inline-flex list-none flex-row items-stretch gap-0.5 rounded-full border border-white/45 bg-black/30 p-0.5",
      "shadow-[0_2px_12px_rgb(0_0_0_/22%),inset_0_1px_0_rgb(255_255_255_/12%)] backdrop-blur-sm",
    ].join(" ");
  }
  if (variant === "compact") {
    return "inline-flex list-none flex-row items-stretch gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/35 p-0.5 shadow-sm";
  }
  return "inline-flex list-none flex-row items-stretch gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-0.5 shadow-sm";
}

function segmentClasses(
  variant: LanguageSwitcherProps["variant"],
  active: boolean,
): string {
  const compactDark = variant === "compactDark";
  const compact = variant === "compact" || compactDark;

  const layout = compact
    ? "min-h-[36px] min-w-[2.25rem] gap-1 px-2 py-1 text-[0.65rem] font-semibold leading-none sm:min-h-[40px] sm:px-2.5"
    : "min-h-[40px] gap-1.5 px-3 py-2 text-xs font-semibold leading-none sm:min-h-[44px] sm:px-3.5";

  const base = [
    "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    layout,
  ].join(" ");

  if (compactDark) {
    return [
      base,
      active
        ? "bg-white/28 text-white shadow-sm focus-visible:ring-white focus-visible:ring-offset-transparent"
        : "text-white/78 hover:bg-white/14 hover:text-white focus-visible:ring-white focus-visible:ring-offset-transparent",
    ].join(" ");
  }

  return [
    base,
    active
      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm focus-visible:ring-[var(--color-primary)]"
      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] focus-visible:ring-[var(--color-primary)]",
  ].join(" ");
}

export function LanguageSwitcher({
  locale,
  labels,
  variant = "default",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const blogLocaleHrefs = useBlogArticleLocaleHrefs();
  const rest = pathWithoutLocale(pathname);
  const active = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  const hrefFor = (loc: AppLocale) => {
    const blogHref = blogLocaleHrefs?.[loc];
    if (blogHref) return blogHref;
    return rest === "/" ? `/${loc}` : `/${loc}${rest}`;
  };

  return (
    <nav aria-label={labels.label}>
      <ul className={`m-0 p-0 ${trackClasses(variant)}`}>
        {locales.map((loc) => {
          const isActive = loc === active;
          return (
            <li key={loc} className="flex">
              <Link
                href={hrefFor(loc)}
                aria-current={isActive ? "page" : undefined}
                className={segmentClasses(variant, isActive)}
                title={labelForLocale(labels, loc)}
              >
                <LocaleFlag locale={loc} className="translate-y-px" />
                <span>{labelForLocale(labels, loc)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
