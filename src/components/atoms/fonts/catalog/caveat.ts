import localFont from "next/font/local";

export const caveat = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/caveat/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-catalog-caveat",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
