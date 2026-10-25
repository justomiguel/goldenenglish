import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { buildRootLayoutIcons } from "@/lib/brand/buildRootLayoutIcons";
import {
  NAGO_INSTALL_CHROME,
  bundledPublicInstallIcon,
  withAppleInstallIcon,
} from "@/lib/brand/bundledPublicInstallIcon";
import { brandPublicFromProperties } from "@/lib/brand/server";
import { defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { cssRootBlock } from "@/lib/theme/themeOverrides";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { readPulsarSupabasePublicEnv } from "@/lib/supabase/pulsar";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { isPulsarPlatformRequest, resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { isMultiTenantEnabled, tenantPublicEnv } from "@/lib/tenant/tenantRegistry";
import { PwaServiceWorkerRegister } from "@/components/molecules/PwaServiceWorkerRegister";
import { TenantPublicEnvBootstrap } from "@/components/molecules/TenantPublicEnvBootstrap";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

export async function generateViewport(): Promise<Viewport> {
  const [{ properties }, snapshot] = await Promise.all([
    loadEffectiveProperties(),
    loadActiveTheme(),
  ]);
  const installIcon = bundledPublicInstallIcon(snapshot?.theme.templateKind);
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: installIcon
      ? NAGO_INSTALL_CHROME
      : getProperty(properties, "color.primary", "#103A5C"),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  if (await isPulsarPlatformRequest()) {
    const metadataBase = (await getRequestPublicSiteUrl()) ?? new URL("https://pulsarlab.cl");
    return {
      metadataBase,
      title: {
        default: "Pulsar Lab",
        template: "%s | Pulsar Lab",
      },
      description: "Infraestructura digital y control plane para institutos y academias.",
    };
  }
  const [{ properties }, snapshot, { url: supabaseUrl }, metadataBaseRaw] = await Promise.all([
    loadEffectiveProperties(),
    loadActiveTheme(),
    readRequestSupabasePublicEnv(),
    getRequestPublicSiteUrl(),
  ]);
  const brand = brandPublicFromProperties(properties, supabaseUrl);
  const installIcon = bundledPublicInstallIcon(snapshot?.theme.templateKind);
  const icons = buildRootLayoutIcons(brand);
  const metadataBase = metadataBaseRaw ?? new URL("http://localhost:3000");
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
    icons: installIcon ? withAppleInstallIcon(icons, installIcon) : icons,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPulsar = await isPulsarPlatformRequest();
  const properties = isPulsar
    ? loadProperties()
    : (await loadEffectiveProperties()).properties;
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
  const pulsarEnv = isPulsar ? readPulsarSupabasePublicEnv() : null;
  const tenant = !isPulsar && isMultiTenantEnabled() ? await resolveRequestTenant() : null;
  const tenantPublic =
    isPulsar && pulsarEnv?.url && pulsarEnv?.anonKey
      ? { url: pulsarEnv.url, anonKey: pulsarEnv.anonKey, origin: "https://pulsarlab.cl" }
      : tenant
        ? tenantPublicEnv(tenant)
        : null;

  return (
    <html
      suppressHydrationWarning
      lang={htmlLang}
      data-scroll-behavior="smooth"
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
        {tenantPublic ? <TenantPublicEnvBootstrap value={tenantPublic} /> : null}
        {children}
        <PwaServiceWorkerRegister />
      </body>
    </html>
  );
}
