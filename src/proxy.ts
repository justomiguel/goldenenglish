import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { scheduleTrafficPageHitFromMiddleware } from "@/lib/analytics/scheduleTrafficPageHitFromMiddleware";
import {
  resolveContentViewViewerSessionOnRequest,
  syncContentViewViewerSessionCookie,
} from "@/lib/analytics/server/contentViewSession";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";

const localeAlternation = locales.join("|");

const localeAwareStaticPathPattern =
  "(?:(?:_next\\/.*)|(?:favicon\\.ico$)|(?:favicon_io\\/.*)|(?:images\\/.*)|(?:geo\\/.*)|(?:sw\\.js$)|(?:robots\\.txt$)|(?:sitemap\\.xml$)|(?:manifest\\.webmanifest$)|(?:.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|geojson|webmanifest|txt|xml|woff2?|ttf|otf)$))";

const rootStaticAssetPattern = new RegExp(
  `^\\/(?!(?:${localeAlternation})\\/)${localeAwareStaticPathPattern}`,
);

const localePrefixedAssetPattern = new RegExp(
  `^\\/(?:${localeAlternation})\\/${localeAwareStaticPathPattern}`,
);

const localePrefixStripPattern = new RegExp(`^\\/(?:${localeAlternation})(?=\\/)`);
const localeBlogPreviewPathPattern = new RegExp(
  `^\\/(?:${localeAlternation})\\/blog\\/preview\\/[^/]+$`,
);

/**
 * Paths without a locale prefix always redirect to `defaultLocale` (Spanish).
 * Browser language does not pick the site entry; users switch locale via the selector when they want English.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  /** Offline fallback page — must stay locale-free for Serwist navigation fallback. */
  if (pathname === "/offline" || pathname === "/offline/") {
    return NextResponse.next();
  }

  /** App Router APIs live at `/api/*`, not under `[locale]` — skip locale prefix redirect. */
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const { response } = await updateSession(request);
    return response;
  }

  if (rootStaticAssetPattern.test(pathname)) {
    /** Next 16+: `NextResponse.next({ request })` expects native `Headers`; pass through without mutation. */
    return NextResponse.next();
  }

  if (localePrefixedAssetPattern.test(pathname)) {
    request.nextUrl.pathname = pathname.replace(localePrefixStripPattern, "");
    return NextResponse.rewrite(request.nextUrl);
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
  resolveContentViewViewerSessionOnRequest(request);
  const { response, userId } = await updateSession(request);
  syncContentViewViewerSessionCookie(request, response);
  if (localeBlogPreviewPathPattern.test(pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  scheduleTrafficPageHitFromMiddleware(request, userId, event);
  return response;
}
