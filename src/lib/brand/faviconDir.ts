/** Directory prefix for generated PNG/ICO assets under `public/` (e.g. `/favicon_io`). */
export function faviconPublicDir(faviconIcoPath: string): string {
  const slash = faviconIcoPath.lastIndexOf("/");
  return slash > 0 ? faviconIcoPath.slice(0, slash) : "";
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
