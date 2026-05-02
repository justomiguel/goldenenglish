/** MIME guess for favicon/manifest/icon entries when `src`/`url` may point to Storage/CDN. */
export function mimeForIconSrc(src: string): string {
  const lower = src.toLowerCase();
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".ico")) return "image/x-icon";
  return "image/png";
}

/** Directory prefix for generated PNG/ICO assets under `public/` (e.g. `/favicon_io`). */
export function faviconPublicDir(faviconIcoPath: string): string {
  const slash = faviconIcoPath.lastIndexOf("/");
  return slash > 0 ? faviconIcoPath.slice(0, slash) : "";
}

/** Site-relative `.ico` under a folder that holds `favicon_io`-style PNG siblings. */
export function usesFaviconIcoBundle(faviconPath: string): boolean {
  const fav = faviconPath.trim();
  if (/^https?:\/\//i.test(fav)) return false;
  return faviconPublicDir(fav).length > 0 && /\.ico$/i.test(fav);
}

/** `icons` entry for the institutional logo in the web manifest (path from `system.properties`). */
export function brandLogoManifestIcon(path: string): {
  type: string;
  sizes?: string;
} {
  const lower = path.toLowerCase();
  if (lower.endsWith(".svg")) {
    return { type: "image/svg+xml", sizes: "any" };
  }
  if (lower.endsWith(".png")) {
    return { type: "image/png", sizes: "512x512" };
  }
  if (lower.endsWith(".webp")) {
    return { type: "image/webp", sizes: "512x512" };
  }
  return { type: "image/png", sizes: "512x512" };
}
