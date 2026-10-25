import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  appendMaskableManifestIcons,
  buildWebManifestIcons,
} from "@/lib/brand/buildWebManifestIcons";
import {
  NAGO_INSTALL_CHROME,
  bundledPublicInstallIcon,
  bundledPublicInstallManifestIcons,
} from "@/lib/brand/bundledPublicInstallIcon";
import { getBrandForRequest } from "@/lib/brand/server";
import { defaultLocale, getDictionary, locales } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [brand, { properties }, snapshot] = await Promise.all([
    getBrandForRequest(),
    loadEffectiveProperties(),
    loadActiveTheme(),
  ]);
  const background = getProperty(properties, "color.background", "#FFFFFF");
  const theme = getProperty(properties, "color.primary", "#103A5C");

  const headerStore = await headers();
  const headerLocale = headerStore.get(GE_REQUEST_LOCALE_HEADER);
  const lang =
    headerLocale && (locales as readonly string[]).includes(headerLocale)
      ? headerLocale
      : defaultLocale;

  const dict = await getDictionary(lang);
  const installIcon = bundledPublicInstallIcon(snapshot?.theme.templateKind);
  const icons = installIcon
    ? bundledPublicInstallManifestIcons(installIcon)
    : appendMaskableManifestIcons(buildWebManifestIcons(brand));
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
    orientation: "any",
    background_color: installIcon ? NAGO_INSTALL_CHROME : background,
    theme_color: installIcon ? NAGO_INSTALL_CHROME : theme,
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
          {
            name: dict.pwa.shortcuts.parentProgress,
            short_name: dict.pwa.shortcuts.parentProgressShort,
            url: `/${lang}/dashboard/parent/progress`,
            icons: [shortcutIcon],
          },
          {
            name: dict.pwa.shortcuts.studentPortal,
            short_name: dict.pwa.shortcuts.studentPortalShort,
            url: `/${lang}/dashboard/student`,
            icons: [shortcutIcon],
          },
        ]
      : undefined,
  };
}
