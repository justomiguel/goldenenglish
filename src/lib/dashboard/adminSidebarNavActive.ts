/**
 * Admin sidebar "active" link detection: longest matching path prefix wins so
 * e.g. `/academic/contents` does not also highlight `/academic`.
 */

export function navHrefPathPrefix(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function navItemCoversPathname(
  pathname: string,
  href: string,
  base: string,
  profileHref: string,
): boolean {
  const prefix = navHrefPathPrefix(href);
  if (href === base || href === profileHref) {
    return pathname === prefix;
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAdminSidebarNavItemActive(
  pathname: string,
  href: string,
  base: string,
  profileHref: string,
  allHrefs: readonly string[],
): boolean {
  if (!navItemCoversPathname(pathname, href, base, profileHref)) return false;

  const selfLen = navHrefPathPrefix(href).length;
  let maxLen = selfLen;
  for (const other of allHrefs) {
    if (!navItemCoversPathname(pathname, other, base, profileHref)) continue;
    maxLen = Math.max(maxLen, navHrefPathPrefix(other).length);
  }
  return selfLen === maxLen;
}
