/** Client-safe absolute URL. The browser origin wins so each institute host stays on itself. */
export function clientAbsoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envBase) return `${envBase}${path}`;
  return path;
}
