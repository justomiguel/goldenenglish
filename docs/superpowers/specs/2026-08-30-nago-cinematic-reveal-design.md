# Nago cinematic reveal

**Date:** 2026-08-30
**Status:** Approved — plan in `docs/superpowers/plans/2026-08-30-nago-cinematic-reveal.md`
**Kind:** Landing motion only. Nagô public marketing surface.

**Depends on:** existing `NagoReveal`, `NagoScrollRoot`, `nagoLanding.css`, and the header stacking contract (`--nago-z-header` above content). This spec does **not** reopen header z-index, tenant chrome, or other landings.

**Skill:** `awwwards-motion-design` (Cinematic personality, CSS + IntersectionObserver, no Motion/GSAP).

## Intent

The Nagô landing should feel like a studio site: one motion language, full coverage below the fold, and three signature moments (hero word mask, gallery wipes, CTA press). Motion serves content. It must not cover the header, jack the scroll, or ignore `prefers-reduced-motion`.

## Why now

Titles and cards already fade in. Gallery photos, footer, and lead form still sit still. Hero type is a block fade, not a word mask. Mestre is a flat two-column grid with no pin.

## Approaches considered

1. **Extend `NagoReveal` + CSS (chosen).** Same IntersectionObserver stack. Add `mask` variant, one hero word splitter, CSS sticky pin on Mestre, gallery stagger cap, CTA press. No new animation library.
2. Add Motion (`motion` / Framer). Rejected: new stack and a second motion dialect.
3. Add GSAP + ScrollTrigger. Rejected: bundle and scrub-pin complexity for one sticky photo.

## Motion brief (normative)

**Personality: Cinematic.** Rich density. Reveal content and create atmosphere. Standard scroll (no scroll-jacking). One sticky pin, no scrub.

**Framework:** CSS keyframes/transitions + existing IntersectionObserver. No Motion, no GSAP.

**Three-curve maximum** (new tokens on `.nago-landing`):

| Role | Token | Use |
|------|--------|-----|
| Primary (entries, reveals) | `--nago-ease-dramatic` | `cubic-bezier(0.77, 0, 0.175, 1)` |
| Secondary (state) | `--nago-spring-smooth` | CSS `linear()` spring; fallback `--nago-ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` |
| Utility (hover, press) | `--nago-ease-snap` | `cubic-bezier(0.22, 1, 0.36, 1)` — current `--nago-ease` becomes an alias of this |

No CSS keyword easings (`ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`) on visible one-shot reveals. `linear` remains allowed only on infinite ambient loops (Ken Burns, discover arrow).

**Intensity lock:** scroll reveals use the same travel (`translate3d(0, 22px, 0)` already on `.nago-reveal`). Hover lift is `2px` on CTAs. Stagger increment is `80ms`. Reveal duration is `700ms` (hard cap `800ms`).

## Components

### `NagoReveal`

Keep `block` (default) and `media`. Add `variant="mask"`:

- Wrapper `overflow: hidden`.
- Inner line/word travels `translateY(110%)` → `0` with `--nago-ease-dramatic`.
- Existing `delay` `1 | 2 | 3` still maps to `d1`/`d2`/`d3` (`80ms` / `160ms` / `240ms`).
- IntersectionObserver stays: `threshold: 0.18`, `rootMargin: 0px 0px -8% 0px`. Disconnect after first intersect (already one-shot via `is-in`).
- `from` and `drift` stay valid on `block` / `media` only. `mask` ignores `from` and `drift`.

### `NagoSplitWords`

Used **only** on the hero `h1` (`#nago-hero-title`).

- Split on spaces. Preserve the gold accent span as its own word group.
- Host has `aria-label` = full visible title string.
- Word spans are `aria-hidden`.
- At most **six** individually staggered words; remaining words share the last delay (skill stagger cap).
- If `prefers-reduced-motion: reduce` or `IntersectionObserver` is missing: render the original children, no split.

### Mestre pin

- `lg` and up: photo column `position: sticky; top: var(--nago-header-h)` so it stays below the fixed header.
- Below `lg`: current media reveal, no sticky.
- Do not add a scroll-linked transform on the pinned photo (no scrub). Count-up stays as today.

### Gallery

- Each masonry item wraps in `NagoReveal variant="media"`.
- First six items take `delay` in repeating `1, 2, 3, 1, 2, 3`.
- Items 7+ have **no** delay class. They still get the media wipe when they intersect.

### Footer and lead form

- Wrap primary footer columns and the lead form shell in `NagoReveal` (`block`).
- Do not stagger every footer link (one reveal per column is enough).

### CTA press / hover

- `.nago-btn`: hover lift `-2px` and `:active { transform: scale(0.97) }` behind `@media (hover: hover) and (pointer: fine)`.
- Specify `transform` only (no `transition: all`).
- Utility curve: `--nago-ease-snap`. Duration ≤ `200ms` hover, `160ms` press.

## Signature moments (maximum three)

1. Hero H1 word mask (`NagoSplitWords`).
2. Gallery media clip wipe (existing `.nago-reveal-media-frame`, applied per tile).
3. CTA press/lift.

No magnetic cursor, no cursor trail, no character scramble, no extra parallax layers beyond the existing hero Ken Burns + drift.

## Coverage map

| Surface | Motion |
|---------|--------|
| Hero title | Word mask, load |
| Hero sub + CTAs | Existing lockup stagger; keep current delays (already under 800ms total) |
| Hero photo | Keep Ken Burns + parallax; disable parallax on coarse pointer and reduced motion (already gated in JS) |
| Section headings | `variant="mask"` |
| Section body / cards | `block` or existing `media` + `from` |
| Program cards | Keep media + side `from` + drift |
| Mestre | Sticky photo `lg+`; text `block`; stats count-up unchanged |
| Gallery tiles | Media wipe; stagger cap 6 |
| Testimonials | Existing block reveal |
| Convert / form / footer | Block reveal |
| Nav | Already present; do not add a second load slide that fights the overlay header |

## Reduced motion and mobile

`prefers-reduced-motion: reduce`:

- Opacity-only (or instant `is-in`). No translate, scale, clip-path, sticky pin, word split, or Ken Burns.
- Existing `nagoLanding.css` reduced-motion block is the single gate; extend it rather than adding a second policy.

Coarse pointer / narrow viewports:

- No Mestre sticky.
- Hero parallax JS already no-ops when reduced motion is set; do not add more scroll-linked layers on mobile.

## Header stacking (do not regress)

Header stays a sibling of `main`, `z-index: var(--nago-z-header)`. Sticky Mestre uses `top: var(--nago-header-h)` and a z-index **below** `--nago-z-header` (content token). Lightbox stays above the header.

## Error handling / resilience

- Missing IO: `NagoReveal` already starts `on` when `IntersectionObserver` is undefined. Keep that.
- Split with empty/whitespace title: render children unchanged.
- Sticky without `lg`: CSS media query only; no JS breakpoint listener.

## Testing (order and contracts, not magic numbers)

1. **`NagoSplitWords`:** given `"Capoeira que transforma."` + accent node, word count matches spaces; host `aria-label` equals the visible string; reduced-motion render has no word spans.
2. **`NagoReveal` mask:** intersecting adds `is-in` and `nago-reveal-mask`; `from`/`drift` are not applied on mask.
3. **Gallery:** first six masonry reveals may have `d1`/`d2`/`d3`; items after the sixth must not.
4. **CSS contract:** new reveal rules use `var(--nago-ease-dramatic)` or `var(--nago-spring-smooth)` or `var(--nago-ease-snap)`. Reduced-motion block still kills transform/animation on reveal, media frame, and sticky pin.
5. **Header stacking tests stay green** (`nagoLandingCss`, `LandingMainSectionsNago`, `NagoSiteHeader`).

Do not assert exact pixel offsets or `z-[80]`.

## Out of scope

- Motion/GSAP/Lenis.
- Page transitions between `/` and `/register`.
- Other tenants (Mi Mundo, Liora, Mozarthitos, Espacio Zenit).
- Magnetic buttons, custom cursor, text scramble, scroll-jacked sections.
- Changing lightbox, sound, or header overlay behavior.

## Success

Scrolling the Nagô landing at a normal pace, every section enters. Gallery tiles wipe. Hero title reveals word by word. Mestre photo pins on desktop. Header never sits under photos. Reduced-motion users get a still, readable page.
