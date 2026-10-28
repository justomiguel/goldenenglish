import type { Metadata } from "next";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";

/**
 * Home tab title uses `absolute` so the root `%s | brand` template does not
 * emit "Brand | Brand". When a tagline exists, join with an em dash.
 */
export function buildHomePageMetadata(
  brandName: string,
  tagline?: string | null,
): Metadata {
  const name = brandName.trim();
  const cleanTagline = tagline?.replace(/\|/g, "—").trim() ?? "";
  const hasDistinctTagline =
    cleanTagline.length > 0 &&
    !cleanTagline.toLowerCase().includes(name.toLowerCase());
  return {
    title: {
      absolute: hasDistinctTagline ? `${name} — ${cleanTagline}` : name,
    },
  };
}

export function buildLocalePageAlternates(
  locale: string,
  suffix: string,
): NonNullable<Metadata["alternates"]> {
  const cleanSuffix = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `/${loc}${cleanSuffix}`;
  }
  languages["x-default"] = `/${defaultLocale}${cleanSuffix}`;
  return {
    canonical: `/${locale}${cleanSuffix}`,
    languages,
  };
}

const CHILE_KINDS = new Set(["mozarthitos", "espaciozenit", "nago", "liora"]);

/** First locale segment of a public path (`/es/preguntas` → `es`). */
export function pageLocaleFromPublicPath(path: string): string {
  const match = path.match(/^\/(es|en|pt)(?:\/|$)/);
  return match?.[1] ?? "es";
}

/** Open Graph locale for an institute page. Chile tenants use `es_CL`. */
export function openGraphLocaleForInstitute(
  templateKind: string | null | undefined,
  pageLocale: string,
): string {
  const chile = CHILE_KINDS.has(templateKind ?? "");
  if (pageLocale === "en") return "en_US";
  if (pageLocale === "pt") return chile ? "pt_CL" : "pt_AR";
  return chile ? "es_CL" : "es_AR";
}
