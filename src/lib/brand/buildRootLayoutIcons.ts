import type { Metadata } from "next";
import {
  brandLogoManifestIcon,
  faviconPublicDir,
  mimeForIconSrc,
  usesFaviconIcoBundle,
} from "@/lib/brand/faviconDir";
import { buildRootLayoutIconsForStorageBundle } from "@/lib/brand/faviconBundleLayoutIcons";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import type { BrandPublic } from "@/lib/brand/server";

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** Prefer PNG/WebP/SVG (often square) for apple-touch; else sibling under favicon_io when favicon is site-relative. */
export function pickAppleTouchIconUrl(brand: BrandPublic): string {
  if (brand.faviconBundlePrefix) {
    return resolveBrandAssetUrl(
      `${brand.faviconBundlePrefix}/apple-touch-icon.png`,
      brand.faviconPath,
    );
  }
  const fav = brand.faviconPath;
  const logo = brand.logoPath;
  if (/\.(png|webp|svg)$/i.test(logo)) return logo;
  if (/\.(png|webp|svg)$/i.test(fav)) return fav;
  if (!isHttpUrl(fav)) {
    const dir = faviconPublicDir(fav);
    if (dir) return `${dir}/apple-touch-icon.png`;
  }
  return fav;
}

/**
 * `<head>` icons for the root layout: same branching as `buildWebManifestIcons`.
 * When logo/favicon are absolute URLs (Storage/CDN per tenant), **do not** derive
 * sibling `favicon_io/*.png` paths — those only exist for site-relative bundles.
 */
export function buildRootLayoutIcons(brand: BrandPublic): Metadata["icons"] {
  if (brand.faviconBundlePrefix) {
    return buildRootLayoutIconsForStorageBundle(
      brand as BrandPublic & { faviconBundlePrefix: string },
    );
  }

  const fav = brand.faviconPath;
  const logo = brand.logoPath;
  const favRemote = isHttpUrl(fav);
  const logoRemote = isHttpUrl(logo);

  if (favRemote || logoRemote) {
    const icon: Array<{ url: string; sizes?: string; type?: string }> = [];
    if (favRemote) {
      icon.push({
        url: fav,
        sizes: "48x48",
        type: mimeForIconSrc(fav),
      });
    }
    if (logoRemote && fav.trim() !== logo.trim()) {
      const meta = brandLogoManifestIcon(logo);
      icon.push({
        url: logo,
        sizes: meta.sizes,
        type: meta.type,
      });
    }
    if (icon.length > 0) {
      return {
        icon,
        apple: pickAppleTouchIconUrl(brand),
        shortcut: fav,
      };
    }
  }

  if (!usesFaviconIcoBundle(fav)) {
    const type = mimeForIconSrc(fav);
    return {
      icon: [
        {
          url: fav,
          sizes: /\.svg$/i.test(fav) ? "any" : "48x48",
          type,
        },
      ],
      apple: pickAppleTouchIconUrl(brand),
      shortcut: fav,
    };
  }

  const faviconDir = faviconPublicDir(fav);
  return {
    icon: [
      {
        url: `${faviconDir}/favicon-16x16.png`,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: `${faviconDir}/favicon-32x32.png`,
        sizes: "32x32",
        type: "image/png",
      },
      { url: fav, sizes: "48x48", type: "image/x-icon" },
    ],
    apple: `${faviconDir}/apple-touch-icon.png`,
    shortcut: fav,
  };
}
