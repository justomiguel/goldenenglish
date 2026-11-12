import localFont from "next/font/local";

export const bebasNeue = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/bebas-neue/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-catalog-bebas-neue",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
