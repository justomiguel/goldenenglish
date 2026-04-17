/**
 * Pure helper that flags pathnames that *should* require authentication but
 * sometimes appear in the **guest** traffic breakdown.
 *
 * Why this happens (and why we surface it instead of hiding it):
 * - Bots / scanners that use a browser-like `User-Agent` and aren't caught by
 *   `isbot`. They probe for common admin URLs but never reach the page (the
 *   layout `redirect()`s them to `/login`).
 * - Logged-in users whose Supabase cookie didn't make it to the
 *   `navigator.sendBeacon` call (third-party-cookie blocking, fresh tab,
 *   session refresh in flight). The page rendered for them as authenticated
 *   but the analytics ping reached the server *without* an identified user.
 * - Historical rows captured before the classifier improvements landed.
 *
 * Surface, don't silence: keeping these rows visible (with a warning) lets the
 * admin spot scanners and cookie issues quickly without losing data.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/teacher",
  "/parent",
  "/student",
  "/profile",
  "/billing",
  "/payments",
];

const PROTECTED_API_PREFIXES = [
  "/api/admin",
  "/api/teacher",
  "/api/parent",
  "/api/student",
  "/api/dashboard",
];

/** Strip an optional `/<locale>` prefix so `/es/dashboard/...` matches `/dashboard/...`. */
function stripLocalePrefix(pathname: string): string {
  const m = pathname.match(/^\/([a-z]{2})(\/|$)/i);
  if (m) {
    return pathname.slice(m[1].length + 1) || "/";
  }
  return pathname;
}

/**
 * Returns true if `pathname` looks like a route that should require a session.
 * Locale-prefixed paths (`/es/dashboard/...`, `/en/profile/...`) match too.
 */
export function isProtectedTrafficPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.trim();
  if (!path.startsWith("/")) return false;

  for (const p of PROTECTED_API_PREFIXES) {
    if (path === p || path.startsWith(`${p}/`)) return true;
  }

  const localeStripped = stripLocalePrefix(path);
  for (const p of PROTECTED_PREFIXES) {
    if (localeStripped === p || localeStripped.startsWith(`${p}/`)) return true;
  }

  return false;
}
