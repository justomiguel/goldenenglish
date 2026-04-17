/**
 * Same glob as `middleware.ts` → `config.matcher[0]` (must be inlined there for Next.js static analysis).
 * Exported for tests and grep; change both places together.
 */
export const proxyPathMatcher =
  "/((?!_next/|favicon\\.ico$|favicon_io/|images/|geo/|manifest\\.webmanifest$|robots\\.txt$|sitemap\\.xml$|sw\\.js$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|geojson|webmanifest|txt|xml|woff2?|ttf|otf)$).*)";
