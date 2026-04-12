import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";

/**
 * Rutas sin prefijo de locale redirigen siempre a `defaultLocale` (español).
 * El idioma del navegador no define la entrada al sitio; el usuario cambia
 * locale con el selector cuando quiera inglés.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /** App Router APIs live at `/api/*`, not under `[locale]` — skip locale prefix redirect. */
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return updateSession(request);
  }

  /**
   * Root metadata routes (`app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts`) are not under
   * `[locale]`. Without this, `/manifest.webmanifest` would redirect to `/es/manifest.webmanifest`
   * and return 404.
   */
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return updateSession(request);
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

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon_io/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
