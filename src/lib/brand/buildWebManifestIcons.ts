import type { MetadataRoute } from "next";
import {
  brandLogoManifestIcon,
  faviconPublicDir,
  mimeForIconSrc,
  usesFaviconIcoBundle,
} from "@/lib/brand/faviconDir";
import { buildWebManifestIconsForStorageBundle } from "@/lib/brand/faviconBundleLayoutIcons";
import type { BrandPublic } from "@/lib/brand/server";

/**
 * PWA manifest icons: full favicon_io set when paths are site-relative; when a
 * logo/favicon is already an absolute URL (Storage/CDN), emit those entries only.
 */
export function appendMaskableManifestIcons(
  icons: NonNullable<MetadataRoute.Manifest["icons"]>,
): NonNullable<MetadataRoute.Manifest["icons"]> {
  const maskable = icons
    .filter((icon) => icon.sizes === "512x512")
    .map((icon) => ({ ...icon, purpose: "maskable" as const }));
  return maskable.length > 0 ? [...icons, ...maskable] : icons;
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
  const logo = brand.logoPath;
  const favRemote = /^https?:\/\//i.test(fav);
  const logoRemote = /^https?:\/\//i.test(logo);

  if (favRemote || logoRemote) {
    const out: NonNullable<MetadataRoute.Manifest["icons"]> = [];
    if (favRemote) {
      out.push({
        src: fav,
        sizes: "48x48",
        type: mimeForIconSrc(fav),
      });
    }
    if (logoRemote) {
      out.push({
        src: logo,
        ...brandLogoManifestIcon(logo),
      });
    }
    if (out.length > 0) return out;
  }

  if (!usesFaviconIcoBundle(fav)) {
    const out: NonNullable<MetadataRoute.Manifest["icons"]> = [
      {
        src: fav,
        sizes: /\.svg$/i.test(fav) ? "any" : "48x48",
        type: mimeForIconSrc(fav),
      },
    ];
    if (logo.trim() !== fav.trim()) {
      out.push({
        src: logo,
        ...brandLogoManifestIcon(logo),
      });
    }
    return out;
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
