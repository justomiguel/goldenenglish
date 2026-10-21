# Public share links: readable paths and contextual WhatsApp previews

**Date:** 2026-10-20
**Status:** Approved
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-25-section-enrollment-link-slug-and-share-design.md`](2026-08-25-section-enrollment-link-slug-and-share-design.md) — section links already use `/{locale}/i/{slug}/{token}`. This spec moves that path to `/inscripcion/` and applies the same idea to every public share.
- ADR to ship in the same change: `docs/adr/2026-10-20-public-share-links.md` (public URL contract and shop slug).

**Governing rules:** `06-seo-performance.mdc`, `09-i18n-copy.mdc`, `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`, `13-postgrest-pagination-bounded-queries.mdc`, `17-trust-boundary-handlers.mdc`, `21-migrations-production-no-data-destruction.mdc`, `03-architecture.mdc`, `08-analytics-observability.mdc`.

## Intent

A person pastes a public link into WhatsApp. The address should say what the page is. The preview should explain the content and show a real photo. Today many links are a UUID or a short prefix (`/b/`, `/i/`, `/q/`). The locale Open Graph card shows the logo and the slogan.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Every public share surface, including badges, matrícula, shop orders, and draft previews |
| Short prefixes | `/b/` → `/logro/`, `/i/` → `/inscripcion/`, `/q/` → `/encuesta/` |
| Path language | Those three words stay Spanish in `en` and `pt` |
| Folders that stay | `events`, `blog`, `tienda`, `contact`, `register`, `matricula` |
| Secret links | `/{locale}/{kind}/{slug}/{secret}`. Lookup is the secret. The slug is cosmetic |
| Shop catalog | `/{locale}/tienda/{slug}`. The slug is stored and unique |
| Old addresses | Permanent redirect (`permanentRedirect`, 308) to the current path |
| Share title | `{what} · {academy}`. Home title is the academy name only |
| Share description | Content summary, max 180 characters. Not the slogan |
| Share image | Page photo, then home photo, then home logo |
| Generated slogan card | Remove `src/app/[locale]/opengraph-image.tsx` |
| Dashboard URLs | Unchanged |
| Text burned into the image | Out of scope |

## URL map

The slug comes from `slugifyPublicPathSegment`. An empty slug uses the fallback in the table.

| Current path | Canonical path | Lookup | Slug source | Empty slug |
|--------------|----------------|--------|-------------|------------|
| `/{locale}/b/{token}` | `/{locale}/logro/{slug}/{token}` | badge token | badge title | `logro` |
| `/{locale}/i/{token}` and `/{locale}/i/{slug}/{token}` | `/{locale}/inscripcion/{slug}/{token}` | enrollment token | section name | `seccion` |
| `/{locale}/q/{slug}` | `/{locale}/encuesta/{slug}` | questionnaire slug | existing slug | n/a |
| `/{locale}/tienda/{uuid}` | `/{locale}/tienda/{slug}` | product slug | product title | `producto` |
| `/{locale}/tienda/pedido/{token}` | `/{locale}/tienda/pedido/{slug}/{token}` | pay token | first product title | `pedido` |
| `/{locale}/matricula/{token}` | `/{locale}/matricula/{slug}/{token}` | pay token | section label | `pago` |
| `/{locale}/blog/preview/{token}` | `/{locale}/blog/vista-previa/{slug}/{token}` | signed preview token | article title | `articulo` |
| `/{locale}/events/preview/{eventId}` | `/{locale}/events/vista-previa/{slug}` | event slug | event title | `evento` |

Rules:

1. A stale cosmetic slug redirects to the current slug. The secret does not change.
2. A shop slug is the public key. Save it on `shop_products.slug` (unique, not null after backfill).
3. When a product title changes and the slug changes, insert the previous slug into `shop_product_slug_aliases`. That alias redirects to the current slug.
4. Generate the first shop slug from the title. If the slug is taken, append `-2`, `-3`, and so on.
5. `/{locale}/events/vista-previa/{slug}` still requires an admin session. A UUID in the old preview path resolves the event and redirects.
6. Secret pages stay `noindex`. A public questionnaire stays indexable. Its canonical URL is the `/encuesta/` path.
7. Update `src/app/robots.ts`: disallow `/blog/vista-previa/` and keep the disallow for `/blog/preview/`.
8. Update sitemap entries that list `/q/` so they list `/encuesta/`.

## Share card

One helper builds the card. Extend `buildPublicShareMetadata` in `src/lib/site/buildPublicShareMetadata.ts`. Add a pure title helper and a pure description clip (180 characters, cut on a word boundary).

| Page | Title | Description |
|------|-------|-------------|
| Home | Academy name | `socialShare.byKind.*.shareContext` for the active template. If that text is missing, one dictionary sentence that says what the academy offers |
| Event, article, product, questionnaire | `{name} · {academy}` | Plain text of the body, excerpt, or product description |
| Section enrollment | `{section} · {academy}` | Cohort and schedule (existing helper) |
| Badge | `{badge title} · {academy}` | What the badge is. Do not put the student name in the preview |
| Matrícula | `{section or pago} · {academy}` | A dictionary sentence that this is the enrollment payment. Do not put the student name in the preview |
| Shop order | `{product} · {academy}` | A dictionary sentence that this is the order. Do not put the buyer name in the preview |
| Draft preview | Same title and description as the published page | Same text the public page would use |
| Expired or unknown secret | Unavailable title from the dictionary | The same unavailable sentence. No private fields |

Image order, first URL that exists:

1. Page photo. Event or article cover, section reference image, product image, or badge image.
2. Home photo. Use the landing media map (`buildLandingMediaMap` plus the tenant bundled fallback). Take section `inicio` at the lowest position. If `inicio` has no image, take section `modalidades` at the lowest position.
3. Home logo. Keep `resolveSharePreviewLogoAbsoluteUrl`.

The locale layout must not set an Open Graph image. Each public page sets `openGraph` and `twitter` through the helper. Absolute image URLs only.

Blog `opengraph-image.tsx` may stay when it returns the article cover bytes. Its fallback returns the home photo, then the logo. It must not draw the slogan. `/logro/` sets the metadata image to the badge image URL, then the home photo, then the logo. Do not draw a slogan card.

WhatsApp keeps a previous card until it fetches the URL again. This spec does not add a cache-bust query.

## Architecture

Pure modules (no Supabase, no React):

- Reuse `slugifyPublicPathSegment`.
- One path module per kind, or one module that builds and parses `logro`, `inscripcion`, `encuesta`, shop product, shop order, matrícula, blog preview, and event preview. Each file stays under 250 lines.
- `buildPublicShareTitle`, `clipShareDescription`.
- Image choice is a pure function: given three optional URLs, return the first non-empty one.

Server loaders pass data in. They do not live in the pure modules.

- Home photo loader reads the active theme media (`inicio`, then `modalidades`) and returns one absolute URL or null.
- Shop slug allocate and alias insert run in the product save action.
- Backfill existing products in the migration: slug from title, then a numeric suffix when needed.

Routes:

- New pages own `generateMetadata` and the screen.
- Old pages only redirect. They do not render the form.
- Copy buttons, `navigator.share`, matrícula mail, shop order mail, and payment return URLs call the path builder. Do not format those paths inline.

Call sites that build the old path today include:

- `buildSectionEnrollmentLinkPath` and `SectionEnrollmentLinkPanel`
- Student and parent badge share URLs (`/b/{token}`)
- `AdminBadgeSharePreview`
- Matrícula pay URL builders and `revalidatePath` under `/matricula/`
- Shop return URLs in `startShopGatewayPayment`, `markShopOrderPaid`, and `shopOrderActionShared`
- Questionnaire copy link and `revalidatePath` under `/q/`
- `EventFormFieldsEditor` preview href
- Blog preview token URL shown to staff
- `src/app/robots.ts`

`pathnameToEntity` gains the new public prefixes when a page view is already tracked for that surface.

## Data

Additive migration only:

- `shop_products.slug text` with a unique index.
- `shop_product_slug_aliases (product_id, slug)` with a unique slug.
- Backfill slugs. Do not drop columns.

RLS: public read of a product slug follows the same rule as a public product read. Alias rows are readable only so the server can redirect. Do not expose buyer or student fields on these tables.

## Privacy and cache

- Matrícula and shop-order HTML stay uncacheable (`Cache-Control: private, no-store`). The preview text does not include a person name.
- A badge preview is the same for every visitor who has the token. It may stay cacheable. It still omits the student name.
- An unknown token returns the unavailable card. It does not echo stored payment or registration fields.

## Errors

- Missing page photo: use the home photo.
- Missing home photo: use the logo.
- Missing description: use the dictionary sentence for that page kind (`en`, `es`, `pt`).
- Invalid secret: unavailable card, `noindex`, no private payload.
- Shop slug collision on save: next free suffix. Do not fail the save for a suffix.

## Tests

Pure tests, one file per helper:

- Build and parse each canonical path.
- Empty-slug fallback.
- Stale slug redirects to the current slug.
- Shop slug suffix and alias redirect.
- Title pattern, 180-character clip, and image order (page, home, logo).
- Invalid token metadata has no private fields.

Route tests mock the loader and assert the redirect target for one old path per kind.

## Out of scope

- Admin and dashboard URLs.
- Renaming `events`, `blog`, or `tienda`.
- Drawing title text onto the preview image.
- Forcing WhatsApp to drop a cached card.
- New photo upload UI. Use photos the product already stores.

## Done when

1. Every row in the URL map is the address that copy, mail, and payment return emit.
2. Each old address redirects to the current one.
3. A WhatsApp fetch of a public page gets a title with the academy, a content description, and an image from the agreed order.
4. The home preview is the home photo or the logo, and the description is not the slogan alone.
5. Vitest covers the helpers and one redirect per kind.
6. The ADR exists and this spec links to it.

## Manual QA (user)

Paste these into WhatsApp after deploy, on a tenant that has a home photo and on one that does not:

- Home
- One event
- One section enrollment link
- One product
- One badge link

Confirm the preview names the page and the academy, and the image is the page photo, the home photo, or the logo.
