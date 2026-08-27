# Tenant landing LCP image and font preloads

**Date:** 2026-08-26
**Status:** Approved
**Kind:** Design spec. Implementation plan after approval.
**Program:** Follow-up to sprint 1 (`2026-08-24-tenant-landing-ssr-perf-seo-design.md`). Same audit canvas (`tenant-perf-seo-audit`).

**Related:**

- `.cursor/rules/06-seo-performance.mdc` — `priority` only for the LCP image; `next/font` must not preload unused families.
- Sprint 1 shipped SSR HTML (title, images, no skeleton) but **Did not** meet Done when §6.
- **Lab post-deploy (Lighthouse 12, mobile, 2026-08-26)** vs baseline 2026-08-25:

  | Tenant | LCP 25 ago | LCP 26 ago | Load Delay 26 ago | TBT | CLS |
  |--------|------------|------------|-------------------|-----|-----|
  | Golden | 9.7 s | 8.7 s | 58% | 40 ms | ~0 |
  | Espacio Zenit | 10.4 s | 11.9 s | 44% (+ 38% Render Delay) | 130 ms | 0 |
  | Mi Mundo | 13.3 s | 13.8 s | 79% | 80 ms | 0 |
  | Mozarthitos | 13.4 s | 14.2 s | 82% | 50 ms | 0 |
  | Liora | 14.1 s | 15.8 s | 79% | 110 ms | 0 |

  LCP elements: Zenit dancer `img` (1122×1402); Golden collage `img`; Mozarthitos / Mi Mundo / Liora **whole hero section** (Liora and Mozarthitos paint the photo via CSS `background-image`). Home `Link` header still preloads **27** font files on every tenant. Nago: no public origin, skip lab.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `06-seo-performance.mdc`, `09-i18n-copy.mdc` (no new user-facing copy; Zenit `h1` reuses existing `hero.tagline` / brush lines), `30-harness-self-contained-tests.mdc`, `32-manual-qa-user-owned.mdc`.

No ADR: no auth, RLS, vendors, or persisted contracts. Public HTML/resource hints only.

## Intent

Each tenant **home** requests **one** LCP image as a real `<img>` (or `next/image`) with `priority` in the first HTML, and preloads **only** the font families that paint the first viewport of **that** tenant. Lab LCP leaves Poor (< 4.0 s) and Load Delay stops being the majority.

## Done when

1. **One LCP image per home.** Marketing heroes that today use CSS `background-image` for the photo (Liora `inicio/1.jpg`, Mozarthitos `inicio/banner.jpg`, Mi Mundo `inicio/hero-bg.jpg`, Nago `inicio/hero-chile.png`) render that photo with `next/image` (`fill` + `sizes` covering the hero, `priority`). Overlay / kenburns / blend stay on wrappers. CMS `mediaMap` still wins where the slot already goes through `resolveLandingImageSrcForTheme`.
2. **At most one `priority` image** in the home landing tree (logo in header does not count if it is not the LCP). Golden collage: one photo. Zenit: only the left dancer (current LCP). Second dancer, galleries, disciplinas: default lazy.
3. **Font `Link` preloads on the home** are only the active tenant’s first-viewport families (target **≤ 4** files, including root). Mechanism: `preload: false` on every `next/font` that is not that set. Root `DM_Sans` / `Fraunces` are `preload: false` (Golden LCP is an image). Each `*FontRoot` may preload **one** display family used in the hero title; body / unused display / Zenit local OTF that are below the fold stay `preload: false`.
4. If after `preload: false` the home still emits preloads for **other tenants’** families, those unused `next/font` modules must not stay in a statically analyzable `import()` fan-out that Next collects into the document. Preferred fix: keep one dispatcher, but each FontRoot’s `next/font` calls use `preload: false` except the active LCP face — Next honors `preload: false` even when it sees the module. Do **not** migrate to raw `@font-face` in this sprint unless `preload: false` fails in a preview measurement.
5. **Zenit home has one visible-or-sr `h1`.** Today the title is two `<p class="ez-mock-brush">` plus a visually hidden `<span>`. Change that span (or the first brush line) to `<h1>` using existing copy. No new dictionary keys. Visual unchanged if the `h1` keeps the same classes as the current first brush line, or stays `sr-only` with the same text as today’s span.
6. Existing hero / FontRoot / section tests updated. New tests are self-contained and pass alone.
7. **CWV gate (same Lighthouse 12 mobile recipe as sprint 1):** after deploy to a reachable URL, re-run the five homes. **Must:** LCP **< 4.0 s**. **Must:** LCP Load Delay no longer the majority. **Target:** LCP < 2.5 s. CLS stays Good. TBT stays ≤ 200 ms. Record the table on the audit canvas. Nago skipped until public.

## Out of scope

- ISR / dropping `force-dynamic` / session on public GET (sprint 2).
- Canonical / hreflang / sitemap / robots.
- Vercel `NEXT_PUBLIC_APP_URL`, Golden www SSL, publishing Nago.
- Deleting Zenit font *families* or restyling heroes (kenburns, overlays, collage geometry stay).
- Cutting Zenit’s below-fold gallery (74 `<img>` in HTML) — lazy is enough; no virtualize / client-only gallery.
- Dashboard / login / blog gates. Register / contact / blog may still load that tenant’s FontRoot; they must not leak **other** tenants’ preloads onto the **home**.
- New copy, analytics, migrations.

## Context

Sprint 1 assumed “heroes already set `priority`; SSR will make LCP work.” Three facts broke that:

1. **CSS background is not an LCP image.** Lighthouse’s LCP for Liora / Mozarthitos / Mi Mundo is the **section box**. The browser does not treat `background-image` as a priority hero; there is no `fetchpriority=high` / preload for that JPEG. Load Delay stays 79–82%.
2. **Too many `priority` images.** Golden marks five collage photos `priority`. Zenit marks both dancers. They contend with the real LCP and with 27 font preloads.
3. **`import()` did not isolate `next/font`.** `loadLandingMainSections` still lists every tenant module in one switch. Next collects those `next/font` instances at compile time and the home `Link` header preloads ~27 woff2/otf. No FontRoot sets `preload: false`. Root layout always preloads DM Sans + Fraunces. `EspacioZenitFontRoot` also imports `mozarthitosLanding.css` (shared tokens); that is CSS, not the 27-font header, and is not this sprint’s visual rewrite.

Zenit `h1=0` is a leftover of the mockup (brush lines as `<p>`).

## Decisions

| Topic | Choice |
|-------|--------|
| LCP photo | `next/image` in the hero tree, `fill` + `sizes` ≈ hero width (`100vw` on mobile), `priority`. CSS keeps color overlay / texture, not the photograph URL. |
| Shared molecule | Small `LandingHeroPhoto` (or equivalent) in `src/components/molecules/`: `src`, `alt` (`""` if decorative), `priority`, `sizes`, `className` for the image. Heroes stay brand-specific around it. File ≤ 250 lines. |
| Mozarthitos | Banner moves from `.mz-hero-surface { background-image }` to the molecule using `img("inicio", "banner.jpg")`. Portrait `2.png` **loses** `priority` (it is not the LCP). |
| Liora | Drop inline `style={{ backgroundImage }}`. Same slot `inicio/1.jpg`. |
| Mi Mundo | `hero-bg.jpg` is decorative (opacity 0.12). Still convert it so the first viewport has a discoverable image; keep opacity/blur on the wrapper. Logo `priority` only if it remains the LCP on desktop **and** the bg is not `priority` — **one** of the two, prefer the photo layer on mobile (logo is `hidden md:block`). |
| Nago | Same as Liora: kenburns wrapper + `next/image` of `hero-chile.png` (or CMS slot). Skip lab until public. |
| Golden | Exactly one collage `priority` (the largest above-the-fold photo). Others lazy. |
| Zenit | Left dancer keeps `priority`; tighten `sizes` to the painted width (not 1122px CSS). Right dancer lazy. `h1` as in Done when §5. |
| Fonts | Keep `next/font` (self-host + swap). Flip `preload` as in Done when §3. Do not split the dispatcher again unless a preview still shows foreign-tenant preloads. |
| Root fonts | `preload: false` on `DM_Sans` and `Fraunces` in `app/layout.tsx`. Dashboard / classic still use the CSS variables; they load without stealing the home LCP slot. |
| Zenit `h1` | Prefer promoting the **first brush line** to `<h1>` with the same classes (one visible heading). Fallback: `sr-only` `<h1>` replacing today’s `<span>`. |
| `force-dynamic` | Keep. Caching remains sprint 2. |

### Options rejected

| Option | Why not |
|--------|---------|
| Only `preload: false` on fonts, no image work | Leaves Liora / Mozarthitos / Mi Mundo LCP as a CSS section. Load Delay stays the majority. |
| Replace all marketing `next/font` with `@font-face` now | Works, but drops subsetting and is a larger visual-risk change. Use only if `preload: false` fails in preview. |
| `next/dynamic` `ssr: false` for FontRoots | Fonts miss SSR; worse FCP / swap. |
| Client-only below-fold gallery for Zenit | Out of scope; changes UX and HTML architecture. |
| Text-only LCP (drop hero photos) | Changes brand design. |

## Architecture

### `LandingHeroPhoto`

Presentational molecule. No theme switch inside. Callers pass the resolved `src` (already through `resolveLandingImageSrcForTheme` when the brand has a media map).

```ts
type LandingHeroPhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};
```

Renders `next/image` with `fill` (parent `relative` + inset). `priority` default `false`; home heroes pass `true` on the single LCP photo.

### Heroes

- `LandingLioraSections`, `LandingMozarthitosSections`, `MiMundoHero`, Nago hero: parent keeps min-height / overlay; photo is the molecule.
- CSS files: delete the photograph `url(...)` on those hero selectors. Keep gradients and grain.
- `LandingHero` (Golden): one `LandingTiltedPhoto` with `priority`; the rest omit it.
- `LandingEspacioZenitHeroMockup`: heading + `priority` as above.

### Fonts

Each `*FontRoot` and `app/layout.tsx` set `preload` explicitly on every `next/font` / `localFont` call. No shared “load all tenants” font module.

`EspacioZenitFontRoot` may keep importing `mozarthitosLanding.css` if EZ classes depend on MZ tokens; that is not a font preload. Do not add more cross-tenant CSS imports.

## Testing (TDD)

1. **`LandingHeroPhoto`** — renders `img` (or Next image) with given `src`; `priority` sets `fetchpriority="high"` / Next priority prop.
2. **Liora / Mozarthitos / Mi Mundo / Nago heroes** — first HTML has the photo `src`; hero `style` / computed CSS does **not** use that JPEG as `background-image`. One `priority` image in the hero.
3. **`LandingHero`** — number of `priority` tilted photos is 1.
4. **Zenit hero** — `getByRole('heading', { level: 1 })` exists; left dancer `priority`, right not.
5. **FontRoot / root layout** — exported font options (extract small `preload` flags or assert the module source / a `fontPreload` helper) mark non-LCP faces `preload: false`. Prefer a tiny helper `marketingFontPreload(role: "lcp" \| "lazy")` so tests do not parse TS.
6. Update existing hero tests that assert `backgroundImage` (Liora today).
7. **CWV (not Vitest):** same `npx lighthouse@12` mobile command as sprint 1. Compare to the 26 ago table.

Harness: each new/touched test file runnable alone (`npx vitest run <file>`).

## Risks

| Risk | Mitigation |
|------|------------|
| Kenburns / cover crop changes after `fill` | Wrapper keeps the animation and `object-cover` + same `object-position` as today’s CSS. |
| CLS when swapping bg → img | Explicit aspect / `fill` in a sized hero (`min-h` already there). Measure CLS; must stay Good. |
| `preload: false` still leaves 27 Link entries | Preview one tenant; if foreign families remain, drop unused `import()` targets from the home graph or last-resort `@font-face`. Do not ship hoping. |
| Golden mobile shows two collage photos | `priority` on the first only; second lazy. |
| Mozarthitos banner not in CMS catalog | Use the same file path as CSS today; wire `mediaMap` if the slot already exists, otherwise keep the static path. |

## Definition of done

- Spec approved + plan on disk + TDD green for the files above.
- Preview or prod Lighthouse mobile meets Done when §7.
- No sitemap / robots / env / `force-dynamic` changes in this drop.
