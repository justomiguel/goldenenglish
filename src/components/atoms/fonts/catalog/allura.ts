import localFont from "next/font/local";

export const allura = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/allura/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-catalog-allura",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
