const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INSTITUTE_PREFIXES = [
  "/calendar",
  "/events",
  "/academic/contents",
  "/badges",
  "/coupons",
  "/promotions",
  "/cms",
  "/site-setup",
  "/settings",
  "/analytics",
  "/audit",
  "/glossary",
  "/communications/templates",
  "/users",
] as const;

export function adminUserDetailId(pathname: string, base: string): string | null {
  const prefix = `${base}/users/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).split("/")[0] ?? "";
  if (rest === "new" || rest === "import") return null;
  return UUID_RE.test(rest) ? rest : null;
}

export function isAdminInstituteChildPath(pathname: string, base: string): boolean {
  if (adminUserDetailId(pathname, base)) return false;
  for (const suffix of INSTITUTE_PREFIXES) {
    const full = `${base}${suffix}`;
    if (pathname === full || pathname.startsWith(`${full}/`)) return true;
  }
  return false;
}
