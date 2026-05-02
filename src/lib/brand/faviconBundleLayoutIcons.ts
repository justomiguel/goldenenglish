import type { Metadata } from "next";
import {
  brandLogoManifestIcon,
  mimeForIconSrc,
} from "@/lib/brand/faviconDir";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import type { BrandPublic } from "@/lib/brand/server";

function bundleSrc(prefix: string, filename: string, fallback: string): string {
  return resolveBrandAssetUrl(`${prefix}/${filename}`, fallback);
}

/** `<head>` icons when `app.favicon.bundle.prefix` points at a favicon.io-style folder in Storage. */
export function buildRootLayoutIconsForStorageBundle(
  brand: BrandPublic & { faviconBundlePrefix: string },
): Metadata["icons"] {
  const p = brand.faviconBundlePrefix;
  const fb = brand.faviconPath;

  const icon16 = bundleSrc(p, "favicon-16x16.png", fb);
  const icon32 = bundleSrc(p, "favicon-32x32.png", fb);
  const apple = bundleSrc(p, "apple-touch-icon.png", fb);

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
): NonNullable<import("next").MetadataRoute.Manifest["icons"]> {
  const p = brand.faviconBundlePrefix;
  const fb = brand.faviconPath;

  return [
    {
      src: bundleSrc(p, "android-chrome-192x192.png", fb),
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: bundleSrc(p, "android-chrome-512x512.png", fb),
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
