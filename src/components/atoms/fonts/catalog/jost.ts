import localFont from "next/font/local";

export const jost = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/jost/latin-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/jost/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/jost/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/jost/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-catalog-jost",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
