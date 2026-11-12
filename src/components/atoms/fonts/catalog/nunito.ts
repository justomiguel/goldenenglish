import localFont from "next/font/local";

export const nunito = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/nunito/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/nunito/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/nunito/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/nunito/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-nunito",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
