import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  appendMaskableManifestIcons,
  buildWebManifestIcons,
} from "@/lib/brand/buildWebManifestIcons";
import { getBrandForRequest } from "@/lib/brand/server";
import { defaultLocale, getDictionary, locales } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandForRequest();
  const { properties } = await loadEffectiveProperties();
  const background = getProperty(properties, "color.background", "#FFFFFF");
  const theme = getProperty(properties, "color.primary", "#103A5C");

  const headerStore = await headers();
  const headerLocale = headerStore.get(GE_REQUEST_LOCALE_HEADER);
  const lang =
    headerLocale && (locales as readonly string[]).includes(headerLocale)
      ? headerLocale
      : defaultLocale;

  const dict = await getDictionary(lang);
  const icons = appendMaskableManifestIcons(buildWebManifestIcons(brand));
  const shortcutIcon =
    icons.find((icon) => icon.sizes === "192x192") ?? icons[0];

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
    lang,
    icons,
    shortcuts: shortcutIcon
      ? [
          {
            name: dict.pwa.shortcuts.parentPayments,
            short_name: dict.pwa.shortcuts.parentPaymentsShort,
            url: `/${lang}/dashboard/parent/payments`,
            icons: [shortcutIcon],
          },
          {
            name: dict.pwa.shortcuts.parentMessages,
            short_name: dict.pwa.shortcuts.parentMessagesShort,
            url: `/${lang}/dashboard/parent/messages`,
            icons: [shortcutIcon],
          },
        ]
      : undefined,
  };
}
