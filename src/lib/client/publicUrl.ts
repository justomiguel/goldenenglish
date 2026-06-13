/** Client-safe absolute URL for copy/share controls (uses NEXT_PUBLIC_APP_URL or window origin). */
export function clientAbsoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envBase) return `${envBase}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}
