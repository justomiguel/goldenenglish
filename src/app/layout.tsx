import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { buildRootLayoutIcons } from "@/lib/brand/buildRootLayoutIcons";
import { brandPublicFromProperties } from "@/lib/brand/server";
import { defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { cssRootBlock } from "@/lib/theme/themeOverrides";
import { getProperty } from "@/lib/theme/themeParser";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { PwaServiceWorkerRegister } from "@/components/molecules/PwaServiceWorkerRegister";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
});

const metadataBase =
  getPublicSiteUrl() ?? new URL("http://localhost:3000");

export async function generateViewport(): Promise<Viewport> {
  const { properties } = await loadEffectiveProperties();
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: getProperty(properties, "color.primary", "#103A5C"),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { properties } = await loadEffectiveProperties();
  const brand = brandPublicFromProperties(properties);
  return {
    metadataBase,
    /** Root `app/manifest.ts` — must be absolute so locale pages do not resolve `/es/manifest.webmanifest`. */
    manifest: new URL("/manifest.webmanifest", metadataBase).href,
    title: {
      default: brand.name,
      template: `%s | ${brand.name}`,
    },
    description: brand.tagline,
    appleWebApp: {
      capable: true,
      title: brand.name,
      statusBarStyle: "black-translucent",
    },
    icons: buildRootLayoutIcons(brand),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { properties } = await loadEffectiveProperties();
  /** `:root` token block (color/layout/shadow) is injected from the merged
   *  `SYSTEM_PROPERTIES_DEFAULTS + active site_themes.properties` so changing a theme
   *  in admin propagates without redeploying. Other static rules
   *  (animations, body, fonts) live in `globals.css`. */
  const themeRootCss = cssRootBlock(properties);

  const headerStore = await headers();
  const headerLocale = headerStore.get(GE_REQUEST_LOCALE_HEADER);
  const htmlLang: AppLocale =
    headerLocale && (locales as readonly string[]).includes(headerLocale)
      ? (headerLocale as AppLocale)
      : defaultLocale;

  return (
    <html
      suppressHydrationWarning
      lang={htmlLang}
      className={`${dmSans.variable} ${fraunces.variable}`}
    >
      <head>
        {/**
         * FullCalendar injects global CSS on module load (`registerStylesRoot` in
         * `@fullcalendar/core/internal-common`): it inserts `style[data-fullcalendar]` *before*
         * the first `<style>` in `<head>`, which pushed `#ge-theme-root` down and broke React
         * hydration. A placeholder first lets FC reuse this node via `querySelector` and keeps
         * theme order stable. FC uses `CSSStyleSheet#insertRule` (not `innerHTML`); content may
         * diverge from SSR — safe to suppress hydration for this tag only.
         */}
        <style data-fullcalendar="" suppressHydrationWarning />
        <style
          id="ge-theme-root"
          dangerouslySetInnerHTML={{ __html: themeRootCss }}
        />
      </head>
      <body className="min-h-dvh min-h-screen touch-manipulation antialiased">
        {children}
        <PwaServiceWorkerRegister />
      </body>
    </html>
  );
}
