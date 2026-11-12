import localFont from "next/font/local";

export const fraunces = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/fraunces/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/fraunces/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/fraunces/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/fraunces/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-fraunces",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
