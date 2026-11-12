import localFont from "next/font/local";

export const jetbrainsMono = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/jetbrains-mono/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/jetbrains-mono/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/jetbrains-mono/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-jetbrains-mono",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
