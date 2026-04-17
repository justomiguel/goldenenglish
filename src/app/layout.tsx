import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { brandPublicFromProperties } from "@/lib/brand/server";
import { faviconPublicDir } from "@/lib/brand/faviconDir";
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
  const faviconDir = faviconPublicDir(brand.faviconPath);
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
    icons: {
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
        { url: brand.faviconPath, sizes: "48x48", type: "image/x-icon" },
      ],
      apple: `${faviconDir}/apple-touch-icon.png`,
      shortcut: brand.faviconPath,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { properties } = await loadEffectiveProperties();
  /** `:root` token block (color/layout/shadow) is injected from the merged
   *  `system.properties + active site_themes.properties` so changing a theme
   *  in admin propagates without redeploying. Other static rules
   *  (animations, body, fonts) live in `globals.css`. */
  const themeRootCss = cssRootBlock(properties);

  return (
    <html
      suppressHydrationWarning
      className={`${dmSans.variable} ${fraunces.variable}`}
    >
      <head>
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
