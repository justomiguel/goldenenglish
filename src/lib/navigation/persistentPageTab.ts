/** Page-level tab id stored in the URL and in sessionStorage. */

export function parsePersistentTab<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
): T | null {
  if (!raw) return null;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

export function pageTabStorageKey(pathname: string, param: string): string {
  const path = pathname.split("?")[0] || "/";
  return `ge:page-tab:${param}:${path}`;
}

export function readStoredPageTab(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredPageTab(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Private mode can reject storage writes. The URL still holds the tab. */
  }
}

export function hrefWithPageTab(
  pathname: string,
  search: string,
  param: string,
  value: string,
): string {
  const params = new URLSearchParams(search);
  params.set(param, value);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
