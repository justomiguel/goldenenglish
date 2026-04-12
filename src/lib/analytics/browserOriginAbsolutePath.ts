/**
 * Builds `https://host/api/...` so requests never resolve under a locale segment
 * (e.g. mistaken `/es/api/...` from relative resolution in some environments).
 */
export function browserOriginAbsolutePath(path: string): string {
  if (typeof window === "undefined") return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}
