# Matiss phone sections and gallery carousel

Date: 2026-11-10
Status: approved

## Understanding

- On a narrow Matiss landing, each section fills one screen. The scroll stops on a section. A section does not rest half off the screen.
- The wide landing stays the current page.
- A click on a gallery photo turns that gallery into a carousel on both widths. The carousel starts on the clicked photo. Close brings the gallery back.

## Decisions (user answers, 2026-11-10)

1. Each phone section is exactly one screen. Long sections shrink or split. The scroll jumps from one section to the next.
2. This snap applies only on the narrow layout. The wide layout does not snap.
3. Groups and the age finder are two screens. The gallery shows four photos, and the rest move sideways. The FAQ shows one answer at a time. The footer sits inside the contact screen.
4. The screen story in the visual companion is accepted.
5. The carousel exists on the narrow layout and on the wide layout.

## Surfaces (Web vs PWA)

Inspected paths: `src/components/pwa/`, `src/components/desktop/`, `*Mobile*`, `*Pwa*`, `useAppSurface`, `SurfaceMountGate`. Matiss has no separate PWA tree. The landing is one server tree in `LandingMainSectionsMatiss`. `LandingSurfaceGate` does not branch Matiss.

This landing is Tier A (public). The interactions differ by width, so the spec does not keep one responsive blob.

- **Web (`web-desktop`), viewport at least 1024px:** the current section order and the current mosaic. No scroll snap. A click on a gallery photo replaces the mosaic with the carousel. Close restores the mosaic.
- **Narrow (`web-mobile`, `pwa-mobile`, and 768px–1023px):** one phone composer. Twelve snap screens. The installed PWA and the mobile browser share that composer. A wide installed window (at least 1024px) uses the desktop tree.
- `useAppSurface` cuts at 767px (`useAppSurfaceCore`). The Matiss menu already collapses below `lg` (1024px). The approved cut is that menu cut. A small hydration-safe hook matches `(max-width: 1023px)`. It does not change `useAppSurface`.

Shared pieces stay shared: header, seal, schedule data, dictionary copy, and the carousel. The phone composer and the desktop composer both render those pieces. Props stay compatible.

## Phone screens

Order, top to bottom. The phone composer is the only vertical scroll. It is `100dvh`, `overflow-y: auto`, and `scroll-snap-type: y mandatory`. The header is `fixed` over that composer. Each screen is `100dvh`, `scroll-snap-align: start`, and `scroll-snap-stop: always`. Content is padded below the fixed header and inside the safe areas. The screen clips overflow. The desktop header stays `sticky`.

1. Hero. Photo, title, and the two buttons.
2. Manifesto. Short text and one photo.
3. Benefits (`#sobre`). Four compact rows.
4. Groups (`#clases`). The three groups. The age finder is not inside this screen.
5. Age finder (`#horarios`). Its own screen.
6. Class day. Four steps and one photo.
7. First class. Three steps and the button.
8. Gala. One photo and one paragraph.
9. Gallery (`#galeria`). Four photos. Sideways control shows the other four. A tap opens the carousel in this same screen.
10. Locations (`#sedes`). Two cards.
11. FAQ (`#preguntas`). One answer is visible. Another question replaces that answer. The screen does not grow.
12. Contact (`#contacto`) plus the footer.

The header links scroll to those ids. On the desktop tree, `#horarios` stays on the age block inside the groups section. On the phone tree, `#horarios` is the age screen.

`prefers-reduced-motion: reduce` keeps the snap and skips extra motion.

## Gallery carousel

One client component serves both trees.

- Closed state on the phone: a four-photo page, with a sideways step for the remaining photos.
- Closed state on the desktop: the current mosaic.
- Open state: the gallery area becomes one large photo, previous, next, a position line, and close. It opens on the clicked index.
- Previous and next wrap. Touch or pointer drag on the photo also moves the index.
- Escape and the close control return to the closed state. Focus returns to the photo that was clicked.
- Controls are at least 44px. The dialog is `aria-modal`. A live region speaks the position.
- Zero photos: the control does not open. One photo: previous and next stay disabled.
- Reduced motion: the index changes with no slide animation.

Copy keys under `landing.matiss.galeria` in `en.json`, `es.json`, and `pt.json`:

- `close`, `prev`, `next`
- `position` with `{current}` and `{total}` (for example "2 of 8", "2 de 8", "2 de 8")

Spanish uses neutral tuteo.

On open, emit the existing `click` event through `trackEvent`. Entity: `gallery:matiss`. Metadata: the index only.

## Architecture

- `LandingMainSectionsMatiss` keeps the header and the font root. A thin client entry chooses the composer after mount. The server paints a short skeleton so the two trees do not hydrate into each other.
- `LandingMatissSections` stays the desktop composer. The age finder remains inside the groups section.
- New phone composer renders the twelve screens and passes the same copy and images.
- New carousel component owns `closed` or `open` plus the index. The gallery section renders it.
- Phone FAQ is a client list with one open answer. Desktop FAQ stays on `<details>`.
- Snap CSS lives in `src/styles/matissPhoneSections.css` and applies only inside the phone composer. `matissLanding.css` stays under 250 lines. `overflow-x-clip` on the desktop `<main>` stays. The phone composer is the snap scrollport. The desktop page does not snap, and its header stays sticky.
- No schema change. No new `event_type`.

## Tests

- Click the third gallery photo. The carousel shows index 2 and the position line `3 de 8`.
- Close returns the four-photo page on a narrow fixture and the mosaic on a wide fixture.
- An empty photo list does not open the carousel.
- The phone composer renders the age finder outside the groups section and gives each screen the snap class.
- The desktop composer still nests the age finder inside the groups section.
- The position label is 1-based. Index 2 renders `3 de 8` in Spanish.

## Manual QA (user)

- Narrow width: each screen fills the viewport, the menu opens the matching screen, the gallery pages sideways, a tap opens the carousel, close returns to the grid.
- Wide width: the page still flows, and a click opens the same carousel.
- Reduced motion: the snap and the carousel still change screens, with no extra slide.

## Out of scope

- Register, contact page, blog, privacy, and answers.
- Desktop section heights.
- New photos or new group names.
- A CentroListo changelog editor. The implementation commit adds one `platform_changelog_entries` row because families will see the phone landing.
