import type { BrandPublic } from "@/lib/brand/server";

/** Absolute URL for OG / `<img src>` when `logoPath` may be relative or https. */
export function resolveBrandLogoAbsoluteUrl(
  brand: BrandPublic,
  siteOrigin: string,
): string {
  const path = brand.logoPath || "/images/logo.png";
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteOrigin.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
