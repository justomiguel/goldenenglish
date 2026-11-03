# CentroListo brand on every page

**Intent:** Every CentroListo page shows the same brand. The logo is visible. The document name is CentroListo. Public pages stay fit for search and for answer engines. People in CentroListo photos wear a garment with the mark.

**Done when:**

- `/cuenta/registro` and `/cuenta/login` use the public site chrome (desktop and PWA), not a thin centered bar.
- The register screen shows one photo of a person in a garment with the CentroListo mark.
- The browser title is `Crea tu cuenta | CentroListo`. It is not `centrolisto | CentroListo`.
- Account routes stay `noindex` and stay out of the sitemap and `llms.txt`.
- Indexable CentroListo pages keep a title, a description, a canonical URL, hreflang, an Open Graph image, and Organization JSON-LD. The entity name is `CentroListo`.
- A standing rule in `.cursor/rules/` requires the host logo and this SEO / GEO contract on every new page.
- New people photos live under `public/centrolisto/wardrobe/`. Alt text comes from the dictionaries.

**Out of scope:** Institute `/register` surfaces (rule 28). Product UI screenshots. Client logos. Runtime image generation. A new photo for every route. Charging or signup logic.

## What is wrong now

`/es/cuenta/registro` paints the paper background and a 26px wordmark in a narrow bar. It has no public header, no footer, and no photo. The Spanish entity string is `centrolisto`, so the tab title becomes `centrolisto | CentroListo`. Marketing photos show people in plain clothes. The mark is not on the garment.

## Decision

Use one public chrome for marketing and for account auth. Keep the admin chrome, and keep the same logo mark there. Add a small wardrobe of still photos. Reuse those files. Do not invent a person per page.

The garment mark is the existing loop: forest sage stroke `#2D5A47` and a terracotta seed `#C87D55`, embroidered small on the chest. It is not a billboard wordmark and not a name badge.

## Options

1. **Public chrome + a shared wardrobe.** Register and login match the site. A few photos are reused. Recommended. One logo system, one photo set, pages stay light.
2. **A unique generated photo on every page.** Rejected. The faces drift, the files grow, and the pages look like a catalog of strangers.
3. **Logo only, no new photos.** Rejected. The register screen still looks like a bare form, and the current people photos do not carry the mark.

## Surfaces (Web vs PWA)

Account auth is a public entry on the CentroListo host. `PulsarSiteChromeEntry` already splits desktop and PWA. Institute Tier A register trees are not part of this change.

- **Web (`web-desktop`):** header with the logo, nav, and footer. Register is two columns: form, then the wardrobe photo. The photo has a stable aspect ratio.
- **PWA (`web-mobile` / `pwa-mobile`):** `PulsarSiteChromePwa`. The photo sits above the form. The submit control stays at least 44px and clears the safe area. Do not dump the desktop nav into the phone header.

Admin stays on `PulsarAdminChrome`. The logo links home. No wardrobe photo inside data tables.

## SEO and answer engines

- The entity name in titles, Open Graph `siteName`, JSON-LD `name`, and `llms.txt` is `CentroListo`. The lowercase wordmark stays inside the logo component only.
- A page sets the topic segment. The layout template adds ` | CentroListo` once.
- Indexable pages: description, canonical, hreflang, Open Graph image, Organization JSON-LD with an absolute logo URL.
- Auth, account, and admin: `robots: { index: false, follow: false }`. They still show the logo and a branded title. They are not in the sitemap or `llms.txt`.
- `llms.txt` lists public answers only. The Organization description says what CentroListo is in one paragraph.

## Wardrobe

Generate still files. Do not call a model at request time.

| File | Use |
|---|---|
| `public/centrolisto/wardrobe/register-desk.jpg` | Register and login, beside or above the form |
| `public/centrolisto/wardrobe/class-knit.jpg` | A public page that already shows a class moment, if that page is edited in this change |
| `public/centrolisto/wardrobe/family-knit.jpg` | A public page that already shows a family, if that page is edited in this change |

Frame: warm paper light, a real room, one person, the embroidery readable but small. No lobby, no name tag, no row of identical portraits.

Alt text keys: `en.json`, `es.json`, and `pt.json`. Spanish on the default market stays tuteo. Country overlays may keep their own voice.

## Rule

Add `.cursor/rules/47-page-brand-seo.mdc` with `alwaysApply: true`, in English.

The rule requires:

- Every HTML page shows the active host logo, linked to that host home, from the brand layer or the CentroListo mark. A page with no logo is a bug.
- The title contains the brand once.
- Indexable routes ship description, canonical, hreflang, share image, and JSON-LD.
- Private routes stay noindex and out of the sitemap.
- CentroListo photos of people use a wardrobe file whose garment carries the mark. Do not paste a new generated face into a component.

## Tests

- Register page renders the logo link and the wardrobe image.
- Pulsar title helper does not emit `centrolisto | CentroListo`.
- `llms.txt` name is `CentroListo` and does not list `/cuenta/registro`.

## Manual QA (user)

- Open `/es/cuenta/registro?pais=ar` on desktop and on a narrow window. Logo, footer, and photo are visible. The tab title is `Crea tu cuenta | CentroListo`.
- Open `/es` and confirm the header logo still matches.
