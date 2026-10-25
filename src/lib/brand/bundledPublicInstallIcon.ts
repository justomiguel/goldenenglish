import type { Metadata, MetadataRoute } from "next";
import { NAGO_BUNDLED_LOGO } from "@/lib/landing/nagoLogo";

/** Home background. The installed splash uses this instead of the admin primary. */
export const NAGO_INSTALL_CHROME = "#070707";

/**
 * Public mark for the installed icon when it must not follow the admin logo.
 * Returns null for every other theme. Those themes keep the site-setup favicon.
 */
export function bundledPublicInstallIcon(
  templateKind: string | null | undefined,
): string | null {
  if (templateKind === "nago") return NAGO_BUNDLED_LOGO;
  return null;
}

/** iOS home-screen icon. The tab favicon stays the admin mark. */
export function withAppleInstallIcon(
  icons: Metadata["icons"],
  apple: string,
): Metadata["icons"] {
  if (!icons || Array.isArray(icons) || typeof icons === "string") {
    return { icon: apple, apple };
  }
  return { ...icons, apple };
}

/** Same file at both sizes. `purpose: any` so Android does not crop the wordmark. */
export function bundledPublicInstallManifestIcons(
  src: string,
): NonNullable<MetadataRoute.Manifest["icons"]> {
  return [
    { src, sizes: "192x192", type: "image/png", purpose: "any" },
    { src, sizes: "512x512", type: "image/png", purpose: "any" },
  ];
}
