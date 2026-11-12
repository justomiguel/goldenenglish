# Theme draft preview

The design editor opens a draft at `/[locale]/plantilla/borrador?token=...`.

## Secret

Set `THEME_PREVIEW_SIGNING_KEY` in the server environment.
Do not commit the value.
Do not prefix it with `NEXT_PUBLIC_`.

The token carries the tenant slug and the draft id.
The editor sets the expiry to 30 minutes.

## Response

The path sends `Cache-Control: private, no-store`.
The page is noindex.
The path is not in the sitemap.

## Host

A token for one tenant returns 404 on another host.
A bad or expired token returns 404.
