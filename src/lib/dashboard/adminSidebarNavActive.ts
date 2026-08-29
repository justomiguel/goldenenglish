/**
 * Admin sidebar "active" link detection: longest matching path prefix wins so
 * e.g. `/academic/contents` does not also highlight `/academic`.
 */

import {
  adminUserDetailId,
  isAdminInstituteChildPath,
} from "@/lib/dashboard/adminInstituteChildPaths";

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

export type AdminSidebarActiveExtras = {
  personRecordRole?: string | null;
};

export function isAdminSidebarNavItemActive(
  pathname: string,
  href: string,
  base: string,
  profileHref: string,
  allHrefs: readonly string[],
  extras: AdminSidebarActiveExtras = {},
): boolean {
  const hrefPath = navHrefPathPrefix(href);
  const userId = adminUserDetailId(pathname, base);
  if (userId) {
    const role = extras.personRecordRole;
    if (role === "student") return hrefPath === `${base}/students`;
    if (role === "teacher") return hrefPath === `${base}/teachers`;
    if (role === "parent") return hrefPath === `${base}/parents`;
    return hrefPath === `${base}/users`;
  }

  if (isAdminInstituteChildPath(pathname, base)) {
    return hrefPath === `${base}/institute`;
  }

  if (!navItemCoversPathname(pathname, href, base, profileHref)) return false;

  const selfLen = hrefPath.length;
  let maxLen = selfLen;
  for (const other of allHrefs) {
    if (!navItemCoversPathname(pathname, other, base, profileHref)) continue;
    maxLen = Math.max(maxLen, navHrefPathPrefix(other).length);
  }
  return selfLen === maxLen;
}
