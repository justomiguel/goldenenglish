import localFont from "next/font/local";

export const pacifico = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/pacifico/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-catalog-pacifico",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
