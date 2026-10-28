import type { Metadata } from "next";

const DIR = "/centrolisto";

export const CENTROLISTO_FAVICON_PATH = `${DIR}/favicon.ico`;
export const CENTROLISTO_LOGO_PATH = `${DIR}/android-chrome-512x512.png`;

/** Tab, Apple, and shortcut icons for the Centro Listo host. */
export function centrolistoLayoutIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [
      { url: `${DIR}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${DIR}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${DIR}/favicon.ico`, type: "image/x-icon" },
    ],
    apple: `${DIR}/apple-touch-icon.png`,
    shortcut: `${DIR}/favicon.ico`,
  };
}
