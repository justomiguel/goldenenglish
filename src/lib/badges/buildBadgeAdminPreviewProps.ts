import "server-only";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import type { Dictionary } from "@/types/i18n";

/**
 * Builds the static (server-only) props needed by `AdminBadgeSharePreview` so
 * the admin form can render WhatsApp / LinkedIn / public-page mockups without
 * round-tripping to the server when the preview language switches.
 *
 * - Loads BOTH locale dictionary slices for `publicStudentBadge` chrome.
 * - Resolves the brand identity (name + logo URL) from `system.properties`.
 * - Resolves the public site origin (NEXT_PUBLIC_APP_URL → VERCEL_URL → localhost).
 */
export async function buildBadgeAdminPreviewProps(): Promise<{
  publicLabels: { en: Dictionary["publicStudentBadge"]; es: Dictionary["publicStudentBadge"] };
  brand: { name: string; logoUrl: string };
  siteOrigin: string;
  sampleToken: string;
}> {
  const [dictEn, dictEs] = await Promise.all([getDictionary("en"), getDictionary("es")]);
  const brand = getBrandPublic();
  const url = getPublicSiteUrl();
  const siteOrigin = url ? url.origin : "https://example.test";
  return {
    publicLabels: { en: dictEn.publicStudentBadge, es: dictEs.publicStudentBadge },
    brand: { name: brand.name, logoUrl: brand.logoPath },
    siteOrigin,
    // Stable sample (matches the catalog code shape but is not a real token).
    sampleToken: "00000000-0000-0000-0000-000000000000",
  };
}
