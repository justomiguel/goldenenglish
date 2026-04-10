/**
 * Public site origin for canonical URLs, OG tags, sitemap (never guess in components).
 * Prefer `NEXT_PUBLIC_APP_URL`; fallback to Vercel preview URL in prod-like deploys.
 */
export function getPublicSiteUrl(): URL | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
      return new URL(normalized);
    } catch {
      /* empty */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      return new URL(`https://${vercel}`);
    } catch {
      /* empty */
    }
  }
  return null;
}

/** Absolute URL for a path starting with `/` (e.g. `/en/login`). */
export function absoluteUrl(pathname: string): URL | null {
  const base = getPublicSiteUrl();
  if (!base) return null;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, base);
}
