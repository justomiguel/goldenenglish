# Matiss — horizontal header lockup, sticky header, rotating seal

Date: 2026-11-10
Status: draft (waiting for approval)

## Understanding

- The client wants the logo to carry more weight on the landing.
- The header must stay at the top while the person scrolls.
- The header gets a horizontal lockup that we design. The round logo moves into the page.
- A round seal turns while the person scrolls. It shows up in several sections, each time in a new spot.

## Decisions (user answers, 2026-11-10)

1. The rotating element is a **seal**: the round logo in the center, ringed by circular text. It is large in the hero and smaller in later sections.
2. The **scroll** turns the seal. If the page does not move, the seal does not move.
3. The header lockup is **our own SVG mark**: the crescent and the four-point star from the logo, plus the wordmark set in the landing display font.

## Root cause — header does not stick

`MatissSiteHeader` already uses `sticky top-0`. Its parent `<main>` in `LandingMainSectionsMatiss.tsx` uses `overflow-x-hidden`. That class makes `<main>` a scroll container, so the sticky header stops working. Fix: use `overflow-x-clip`. That class clips the overflow and does not make a scroll container.

## Plan

### 1. Mark and lockup

- New `src/components/atoms/MatissMark.tsx`: an inline SVG with the crescent and the four-point star. It uses `currentColor` and the token colors (`--matiss-violet`, `--matiss-pink`). It is decorative (`aria-hidden`).
- New `src/components/molecules/MatissLockup.tsx`: the mark plus the wordmark in HTML text.
  - The wordmark text comes from `brand.name` (brand layer). The first word renders large and lowercase in `matiss-display`. The remaining words render small, uppercase, and tracked. Nothing is hard-coded.
  - The link keeps `aria-label={brand.logoAlt}`.
- The wordmark is HTML text, not SVG text. An SVG in `<img>` cannot load the web font.

### 2. Header

- `MatissSiteHeader` shows `MatissLockup` instead of the round `<img>`.
- The header gets a little denser after the first scroll:
  - The padding goes down.
  - The paper background gets more opaque.
  - A soft shadow appears.
- A small client hook (`useScrolledPast`) sets that state with `IntersectionObserver` on a sentinel. There is no scroll listener.
- `overflow-x-hidden` becomes `overflow-x-clip` on the Matiss `<main>`. Register and contact use `MatissFontRoot`. Check them for the same issue and fix it there too if needed.

### 3. Rotating seal

- New `src/components/molecules/MatissSeal.tsx`:
  - The center is the round brand logo (`brand.logoPath`).
  - The ring is circular SVG text on a `<textPath>`. The text comes from `landing.matiss.seal.ring` in `en.json`, `es.json`, and `pt.json`, for example "Gimnasia acrobática · San Miguel · La Florida ·".
  - Sizes: `lg` (hero), `md`, and `sm`.
  - Only the ring rotates. The logo in the center stays upright and readable.
- Rotation follows the scroll. It uses CSS scroll-driven animation (`animation-timeline: scroll(root)`) inside `@supports` and `prefers-reduced-motion: no-preference`. One full page scroll is about one turn.
  - Without support or with reduced motion, the seal stays still.
  - No JS scroll handler.
- Placements (each one in a new spot):
  - Hero: `lg`, over the lower corner of the hero photo. The center logo has the brand alt. This is the place where the round logo stays visible.
  - Benefits (`#sobre`): `md`, over the top corner of the sticky photo.
  - Gala: `md`, on the side opposite the text card.
  - Contact: `sm`, next to the heading.
  - In sections after the hero, the seal is decorative (`aria-hidden`, empty alt).
- On narrow screens, the section seals use the next smaller size, and they do not cover faces in the photos.

### 4. Copy and catalog

- Add `landing.matiss.seal.ring` to `en.json`, `es.json`, and `pt.json` (es in neutral tuteo).
- Add the key to `landingMatissCatalog.ts` so staff can edit it.

### 5. Changelog

- New entry at the top of `catalogEntriesHead.ts` (`matiss-header-seal`, area `site`). If the file goes over 250 lines, move the last entry to `catalogEntriesHeadNext.ts`.

## Surfaces (Web vs PWA)

The Matiss landing is Tier A. It has one tree inside `LandingSurfaceGate`. This change keeps that shape.

- **Web (`web-desktop`)**:
  - The header shows the full lockup, the nav links, and the account CTA.
  - Seals use `lg`, `md`, and `sm`.
- **PWA / mobile (`web-mobile`, `pwa-mobile`)**:
  - The header shows the lockup at a smaller size, the account CTA, and the menu button. Every target is at least 44px.
  - The sticky header keeps the safe-area top padding.
  - The hero seal is smaller. Section seals drop one size, and the contact seal is hidden below `sm`.
- `MatissSiteHeader` keeps its props, and its callers do not change: landing, register, contact, blog, and privacy. `brand` is already available at every caller. If the lockup needs `brandName`, it becomes one new prop, and every caller passes it.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| The lockup no longer shows `brand.logoPath` in the header (`47-page-brand-seo`). | The lockup is the host logo in horizontal form, built from `brand.name`. The round `brand.logoPath` stays visible in the hero seal. The OG image and the favicon do not change. |
| Scroll-driven animation is missing in Safari and Firefox. | The seal stays still there. Content and layout do not depend on the animation. |
| A seal can cover a face in a photo. | Fixed corner positions, a check against each crop, and smaller sizes on mobile. |
| The circular text can be unreadable when small. | The ring text has a minimum font size. The `sm` seal on mobile is hidden below `sm`. |

## Tests

- `MatissLockup`: renders the first word of `brand.name` and the rest, and keeps the `aria-label`.
- `MatissSeal`: renders the ring text from the dict and the center logo. The decorative variant uses `aria-hidden` and an empty alt.
- `MatissSiteHeader`: renders the lockup, not the round `<img>`.
- `LandingMatissSections`: the hero seal is present with the brand alt, and the ring text is present.
- Static check: the Matiss `<main>` does not use `overflow-x-hidden`.
- Existing Matiss tests stay green.

## Definition of done

- The header stays at the top while the page scrolls, on the desktop and on the phone.
- The header shows the horizontal lockup. The round logo shows inside the hero seal.
- The seal ring turns with the scroll and stops when the scroll stops. With reduced motion it does not move.
- Seals show in the hero, benefits, gala, and contact, each in a new spot, and they do not cover faces.
- The ring copy is in `en.json`, `es.json`, and `pt.json`, and in the CMS catalog.
- Vitest, typecheck, and lint pass. The changelog entry exists.
- Manual QA (user): sticky header, how the seal turns, and the seal spots on desktop and on the phone.

## Out of scope

- A new favicon, a new OG image, or edits to `brand.logoPath`.
- A redraw of the dancer.
- Header changes for other tenants.
