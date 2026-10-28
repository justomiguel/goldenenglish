# Centro Listo share cards

## Intent

Make a Centro Listo link show a large preview on WhatsApp, iMessage, and X. Point crawlers at the public pages only.

## Done when

- `public/centrolisto/og.png` is 1200×630, alabaster, with the sage mark and the word centrolisto.
- Pulsar pages set `og:title`, `og:description`, `og:image` (absolute), and `twitter:card=summary_large_image`.
- On a Pulsar host, including bare localhost when `DEV_TENANT_SLUG=pulsar`, `robots.txt` disallows `/admin` and `/dashboard`.
- That same host's `sitemap.xml` lists home, `/producto`, `/clientes`, and `/contacto` only, and does not query the institute database.
- `/favicon.ico` on that host rewrites to the Centro Listo icon.
- The web manifest does not list parent or student shortcuts.
- The locale layout emits Organization JSON-LD.

## Out of scope

- Institute tenant share images.
- A second image per locale. The picture stays the mark. The title and description come from the dictionary.
