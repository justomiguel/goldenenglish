import localFont from "next/font/local";

export const cormorantGaramond = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/cormorant-garamond/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/cormorant-garamond/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/cormorant-garamond/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-cormorant-garamond",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
