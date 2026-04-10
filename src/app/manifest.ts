import type { MetadataRoute } from "next";
import {
  brandLogoManifestIcon,
  faviconPublicDir,
} from "@/lib/brand/faviconDir";
import { loadProperties, getProperty } from "@/lib/theme/themeParser";
import { getBrandPublic } from "@/lib/brand/server";

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandPublic();
  const p = loadProperties();
  const background = getProperty(p, "color.background", "#FFFFFF");
  const theme = getProperty(p, "color.primary", "#103A5C");
  const favDir = faviconPublicDir(brand.faviconPath);

  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: background,
    theme_color: theme,
    lang: "es",
    icons: [
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
    ],
  };
}
