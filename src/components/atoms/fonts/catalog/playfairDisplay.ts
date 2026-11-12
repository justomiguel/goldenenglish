import localFont from "next/font/local";

export const playfairDisplay = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/playfair-display/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/playfair-display/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/playfair-display/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-catalog-playfair-display",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
