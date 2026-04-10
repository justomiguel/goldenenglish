import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { loadProperties, getProperty } from "@/lib/theme/themeParser";
import { faviconPublicDir } from "@/lib/brand/faviconDir";
import { getBrandPublic } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { PwaServiceWorkerRegister } from "@/components/molecules/PwaServiceWorkerRegister";
import "./globals.css";

const themeProps = loadProperties();
const themeColor = getProperty(themeProps, "color.primary", "#103A5C");
const brand = getBrandPublic();
const faviconDir = faviconPublicDir(brand.faviconPath);
const metadataBase =
  getPublicSiteUrl() ?? new URL("http://localhost:3000");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor,
};

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

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: brand.tagline,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${dmSans.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
        <PwaServiceWorkerRegister />
      </body>
    </html>
  );
}
