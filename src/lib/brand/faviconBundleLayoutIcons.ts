import type { Metadata } from "next";
import {
  brandLogoManifestIcon,
  mimeForIconSrc,
} from "@/lib/brand/faviconDir";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import type { BrandPublic } from "@/lib/brand/server";

const STORAGE_ORIGIN_RE =
  /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/landing-media\//i;

function storageOriginFromUrl(candidate: string): string | null {
  const match = candidate.trim().match(STORAGE_ORIGIN_RE);
  return match?.[1] ?? null;
}

function bundleSrc(
  prefix: string,
  filename: string,
  fallback: string,
  supabaseUrl?: string | null,
): string {
  return resolveBrandAssetUrl(
    `${prefix}/${filename}`,
    fallback,
    supabaseUrl ?? storageOriginFromUrl(fallback),
  );
}

/** `<head>` icons when `app.favicon.bundle.prefix` points at a favicon.io-style folder in Storage. */
export function buildRootLayoutIconsForStorageBundle(
  brand: BrandPublic & { faviconBundlePrefix: string },
  supabaseUrl?: string | null,
): Metadata["icons"] {
  const p = brand.faviconBundlePrefix;
  const fb = brand.faviconPath;

  const icon16 = bundleSrc(p, "favicon-16x16.png", fb, supabaseUrl);
  const icon32 = bundleSrc(p, "favicon-32x32.png", fb, supabaseUrl);
  const apple = bundleSrc(p, "apple-touch-icon.png", fb, supabaseUrl);

  return {
    icon: [
      { url: icon16, sizes: "16x16", type: "image/png" },
      { url: icon32, sizes: "32x32", type: "image/png" },
      { url: fb, sizes: "48x48", type: mimeForIconSrc(fb) },
    ],
    apple,
    shortcut: fb,
  };
}

/** Manifest icons for the same Storage bundle (includes PNG sizes Next expects). */
export function buildWebManifestIconsForStorageBundle(
  brand: BrandPublic & { faviconBundlePrefix: string },
  supabaseUrl?: string | null,
): NonNullable<import("next").MetadataRoute.Manifest["icons"]> {
  const p = brand.faviconBundlePrefix;
  const fb = brand.faviconPath;

  return [
    {
      src: bundleSrc(p, "android-chrome-192x192.png", fb, supabaseUrl),
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: bundleSrc(p, "android-chrome-512x512.png", fb, supabaseUrl),
      sizes: "512x512",
      type: "image/png",
    },
    { src: fb, sizes: "48x48", type: mimeForIconSrc(fb) },
    {
      src: brand.logoPath,
      ...brandLogoManifestIcon(brand.logoPath),
    },
  ];
}
