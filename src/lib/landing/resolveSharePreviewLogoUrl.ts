import type { BrandPublic } from "@/lib/brand/server";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import type { SharePreviewBundleKey } from "@/lib/landing/sharePreviewBundleKey";

/** Try bundled `/images/<bundle>/logo/*` first (PNG then AVIF for golden). */
const CANDIDATES: Record<SharePreviewBundleKey, readonly string[]> = {
  golden: ["/images/golden/logo/1.png", "/images/golden/logo/1.avif"],
  mozarthitos: ["/images/mozarthitos/logo/1.png"],
  espaciozenit: ["/images/espaciozenit/logo/1.png"],
  nago: ["/images/nago/inicio/1.png", "/images/nago/logo/logo.png"],
  mimundo: ["/images/mimundo/logo/logo.jpg"],
};

/**
 * Absolute logo URL for Open Graph generation: prefers bundled theme logos,
 * falls back to merged brand logo from `SYSTEM_PROPERTIES_DEFAULTS` / theme overrides.
 */
export async function resolveSharePreviewLogoAbsoluteUrl(
  siteOrigin: string,
  bundleKey: SharePreviewBundleKey,
  brand: BrandPublic,
): Promise<string> {
  const origin = siteOrigin.replace(/\/$/, "");
  for (const path of CANDIDATES[bundleKey]) {
    const url = `${origin}${path}`;
    try {
      const res = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
      });
      if (res.ok) return url;
    } catch {
      /* try next candidate */
    }
  }
  return resolveBrandLogoAbsoluteUrl(brand, origin);
}
