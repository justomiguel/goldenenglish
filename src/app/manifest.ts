import type { MetadataRoute } from "next";
import { buildWebManifestIcons } from "@/lib/brand/buildWebManifestIcons";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandForRequest();
  const { properties } = await loadEffectiveProperties();
  const background = getProperty(properties, "color.background", "#FFFFFF");
  const theme = getProperty(properties, "color.primary", "#103A5C");

  return {
    id: "/",
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: background,
    theme_color: theme,
    lang: "es",
    icons: buildWebManifestIcons(brand),
  };
}
