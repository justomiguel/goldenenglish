import localFont from "next/font/local";

export const plusJakartaSans = localFont({
  src: [
    {
      path: "../../../../../public/fonts/catalog/plus-jakarta-sans/latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/plus-jakarta-sans/latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/plus-jakarta-sans/latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../../../public/fonts/catalog/plus-jakarta-sans/latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-catalog-plus-jakarta-sans",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: false,
});
