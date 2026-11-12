import localFont from "next/font/local";

export const baloo2 = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/baloo-2/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/baloo-2/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/baloo-2/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-baloo-2",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
