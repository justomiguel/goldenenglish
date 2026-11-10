import type { MetadataRoute } from "next";
import {
  brandLogoManifestIcon,
  faviconPublicDir,
  usesFaviconIcoBundle,
} from "@/lib/brand/faviconDir";
import { buildWebManifestIconsForStorageBundle } from "@/lib/brand/faviconBundleLayoutIcons";
import type { BrandPublic } from "@/lib/brand/server";

/**
 * PWA manifest icons. An ico bundle keeps its sibling PNGs. Every other mark
 * uses `/pwa/icon/192` and `/pwa/icon/512`, which scale the host logo.
 */
export function appendMaskableManifestIcons(
  icons: NonNullable<MetadataRoute.Manifest["icons"]>,
): NonNullable<MetadataRoute.Manifest["icons"]> {
  const maskable = icons
    .filter((icon) => icon.sizes === "512x512")
    .map((icon) => ({ ...icon, purpose: "maskable" as const }));
  return maskable.length > 0 ? [...icons, ...maskable] : icons;
}

/** Exact PNG sizes. The route scales the host mark so the pixels match the label. */
export function installPngManifestIcons(): NonNullable<MetadataRoute.Manifest["icons"]> {
  return [
    { src: "/pwa/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/pwa/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
  ];
}

export function buildWebManifestIcons(
  brand: BrandPublic,
): NonNullable<MetadataRoute.Manifest["icons"]> {
  if (brand.faviconBundlePrefix) {
    return buildWebManifestIconsForStorageBundle(
      brand as BrandPublic & { faviconBundlePrefix: string },
    );
  }

  const fav = brand.faviconPath;

  if (!usesFaviconIcoBundle(fav)) {
    return installPngManifestIcons();
  }

  const favDir = faviconPublicDir(fav);
  return [
    {
      src: `${favDir}/android-chrome-192x192.png`,
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: `${favDir}/android-chrome-512x512.png`,
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: brand.faviconPath,
      sizes: "48x48",
      type: "image/x-icon",
    },
    {
      src: brand.logoPath,
      ...brandLogoManifestIcon(brand.logoPath),
    },
  ];
}
