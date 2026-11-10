# Plan — Liora native mobile and PWA

Spec: `docs/superpowers/specs/2026-11-10-liora-mobile-native-design.md` (approved 2026-11-10). The user also approved: ribbon hidden on narrow, install sheet only after the hero.

"Narrow" means below `md` (768 px) in CSS, or `web-mobile` / `pwa-mobile` from `useAppSurface` in JS.

## Tasks

1. **Header** — `LioraSiteHeader`: logo link `min-w-0 shrink` below `xl`. Link row from `xl`, menu button below `xl`, container `max-w-7xl`, social icons from `2xl`. Account nav `hidden md:flex`. Lockup motto hidden below `md`. Test in `LioraSiteHeader.test.tsx`.
2. **Installed top bar** — `PublicExperienceFrame`: no `PublicInstalledTopBar` when `variant === "liora"`. Test in `PublicInstalledTopBar.test.tsx`; tab label in `PublicExperienceChrome.liora.test.tsx`.
3. **Hero** — `LandingLioraHero`: logo `hidden md:block`. First CTA full width on narrow. Other register CTAs render as text links below `md` and as buttons from `md`. "Ver horarios" `hidden md:inline-flex`. Hero height on narrow is `100svh` minus the header and the tab bar (`lioraLanding.css`). The hero carries `data-pwa-install-defer`. Tests in `LandingLioraSections.test.tsx`.
4. **First visit**
   - `HomeEventPopupOrInline` (new): `SurfaceMountGate`; desktop → `HomeEventPopup`; narrow → `HomeEventInlineCard` (new) portaled into `#home-event-inline-slot`. `page.tsx` uses it when `templateKind === "liora"`. The card reuses `HomeEventPopupSlide` and sends `surface: "home_inline"`, `intent: "open_register"`.
   - `LandingLioraSections` renders the slot after the hero.
   - `usePwaInstallDeferral` (new): if the page has `[data-pwa-install-defer]`, ready only after that element is above the viewport and no `dialog[open]` exists. Otherwise ready at once. It reads the marker on each scroll, because hydration replaces the hero node (an `IntersectionObserver` on the first node never fired). `PwaInstallPrompt` returns null until ready.
5. **Clases** — narrow: `overflow-x-auto snap-x snap-mandatory`, card width 82 %, photo 4:3; grid from `sm`. CSS only, so no gate is needed. Test asserts the snap list.
6. **Galería** — `LioraGalleryStripNarrow` (new) behind `SurfaceMountGate` inside `LioraLandingGallery`: native scroll snap, counter from `scrollLeft`, autoplay with `scrollTo` until first `pointerdown`/`touchstart`, no arrows. Desktop keeps the transform strip.
7. **Sedes** — image `hidden md:block`.
8. **Ribbon** — `LioraRibbonOverlay` mounts only at `min-width: 768px` (`useSyncExternalStore` media query); CSS `display:none` below `md` as a guard.
9. **Text and footer** — card text `text-[0.9375rem] md:text-sm`. Footer: section links `hidden md:list-item`; login link removed below `md`; link rows `min-h-11` on narrow.
10. **Tab label** — `PublicExperienceChrome` uses `landing.liora.nav.clases` for the `liora` kind when no `coursesLabel` is passed.
11. **Copy** — no new visible strings. The inline event card reuses the popup copy.
12. **Changelog** — `supabase/pulsar-migrations/026_liora_mobile_native_changelog.sql` (rule 39: the catalog is in the database now).
13. **Checks** — lint, `tsc`, related unit tests, captures at 360 to 1600 px, precommit hook. One commit. No Liora E2E: the precommit E2E server serves one test tenant.
