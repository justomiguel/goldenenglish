# Public share links

## Context

Public links are pasted into WhatsApp. Many addresses are a UUID or a short prefix. The locale Open Graph file draws the logo and the slogan on every child route. A reader cannot tell what the page is.

## Decision

Use one path contract. A secret link is `/{locale}/{kind}/{slug}/{secret}`. The secret is the lookup key. The slug is cosmetic and redirects when it is stale. Shop products store a unique slug. A retired slug is an alias that redirects. The share card title is `{what} · {academy}`. The description is the page summary, clipped to 180 characters. The image is the page photo, then the home photo (`inicio`, then `modalidades`), then the home logo. Delete the locale slogan card. Old `/b/`, `/i/`, `/q/`, and UUID paths redirect with `permanentRedirect` (308).

## Options considered

Keep the short prefixes and only change the card. Rejected. The address would still hide the page.

Burn the title into a generated image. Rejected. WhatsApp already shows the title and the description next to a real photo.

## Consequences

- Migration `218_shop_product_slugs.sql` adds `shop_products.slug` and `shop_product_slug_aliases`.
- Copy buttons, mail, and payment return URLs call the same path builders.
- Matrícula and shop-order cards stay `noindex` and omit the student or buyer name.
- Unknown tokens show an unavailable card and do not return private fields.
- WhatsApp keeps a cached card until its own cache expires. Do not add a cache-bust query.
