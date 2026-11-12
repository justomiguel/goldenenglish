import localFont from "next/font/local";

export const oswald = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/oswald/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/oswald/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/oswald/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/oswald/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-oswald",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
