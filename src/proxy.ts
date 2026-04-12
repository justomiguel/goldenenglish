import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";

/**
 * Paths without a locale prefix always redirect to `defaultLocale` (Spanish).
 * Browser language does not pick the site entry; users switch locale via the selector when they want English.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /** App Router APIs live at `/api/*`, not under `[locale]` — skip locale prefix redirect. */
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return updateSession(request);
  }

  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    /** Next 16+: `NextResponse.next({ request })` expects native `Headers`; pass through without mutation. */
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  );

  if (!hasLocale) {
    request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const parentDash = pathname.match(/^\/([^/]+)\/parent\/dashboard\/?$/);
  if (parentDash) {
    const loc = parentDash[1];
    request.nextUrl.pathname = `/${loc}/dashboard/parent`;
    return NextResponse.redirect(request.nextUrl);
  }

  /** Always refresh the Supabase session (incl. `/login` / `/register`) so cookies stay in sync after sign-in. */
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon_io/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
