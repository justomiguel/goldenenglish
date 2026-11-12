import localFont from "next/font/local";

export const outfit = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/outfit/latin-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/outfit/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/outfit/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/outfit/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/outfit/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-outfit",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
