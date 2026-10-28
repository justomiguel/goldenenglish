import { proxy } from "@/proxy";

/**
 * Next.js parses `config.matcher` at compile time — it must be a string literal here,
 * not an imported binding. Keep in sync with `src/lib/middleware/proxyPathMatcher.ts`.
 */
export const config = {
  matcher: [
    "/((?!_next/|favicon\\.ico$|favicon_io/|images/|videos/|geo/|manifest\\.webmanifest$|robots\\.txt$|sitemap\\.xml$|sw\\.js$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|ico|css|js|map|geojson|webmanifest|txt|xml|woff2?|ttf|otf)$).*)",
  ],
};

export const middleware = proxy;
