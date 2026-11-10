# Liora landing redesign — Instagram style, horizontal logo, ballet ribbon

## Intent

Make the Liora landing look like Liora's Instagram flyers. Give the brand a horizontal logo in the sticky header. Add one ballet motion that ties the home page together: a fine rose ribbon that draws itself as the visitor scrolls, with the logo dancer riding its tip and settling into a pose in each section.

## Decisions (user-approved in the visual companion)

| Topic | Choice |
|---|---|
| Header lockup | **C** — dancer figure, `LIORA STUDIO`, and the motto on one line. On scroll the motto leaves and the figure stays small beside the name. |
| Ribbon route | **A** — the ribbon weaves from side to side. Section text alternates sides so the dancer crosses open space, not copy. |
| Palette | **B** — Instagram look, adjusted to pass WCAG AA. |

Instagram could not be read (login wall). The style comes from two flyer screenshots the user sent ("Ballet Infantil 6–9", "Preballet 3–4").

## Understanding

- Liora is an exclusive theme (`51-exclusive-client-themes.mdc`). Entry: `LandingMainSectionsLiora` → `LioraFontRoot` + `LioraSiteHeader` + `LandingLioraSections`.
- `LioraSiteHeader` is already `sticky`. It shows the square PNG logo (`brand.logoPath`), which is too tall and unclear in a bar.
- `LioraFontRoot` and `LioraSiteHeader` are also used by blog, contact, privacy, answer, register, and `PublicTenantChrome`. Palette and header changes reach those pages too. That is intended: one brand.
- There is no PWA tree for Liora. See **Surfaces**.

## Visual system

### Palette (`src/styles/lioraLanding.css`, `.liora-landing`)

The old cream, terracotta, and coffee tokens are replaced. Token names stay where possible so existing sections keep working.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--liora-cream` (paper) | `#fcf2f1` | page background | — |
| `--liora-blush` | `#f6dfe0` | alternate section band, photo glow | — |
| `--liora-rose` | `#e48a94` | ribbon, hearts, hairlines, sparkles only. **Never text.** | decorative |
| `--liora-rose-title` (new) | `#c25a6a` | display titles ≥ 24 px | 3.85:1 on paper |
| `--liora-rose-deep` | `#b84f61` | button and pill fills, rose text ≥ 18.67 px bold | white on it 4.85:1; 4.41:1 on paper |
| `--liora-rose-text` (new) | `#a8475a` | links and emphasized words in body copy; hover and active on filled controls | 5.15:1 on paper; white on it 5.65:1 |
| `--liora-ink` | `#4a3f40` | body text, headings in ink | 9.2:1 |
| `--liora-ink-soft` | `#6b5f58` | secondary text | 5.6:1 |
| `--liora-line` | `#f0d9da` | borders | — |
| `--liora-footer` | `#4a3f40` | footer band | cream text 9.2:1 |

`--liora-rose-hover` becomes an alias of `--liora-rose-text`. Rose text at body size always uses `--liora-rose-text`.

### Type (`LioraFontRoot.tsx`)

- Display: **Playfair Display** 500/600 (`--font-liora-display`), replacing Cormorant Garamond. `preload: true`.
- Script accent: **Allura** 400 (`--font-liora-script`), `preload: false`. Used only for the second word of a section title (for example "Ballet *infantil*"). Never body text, never buttons.
- Body: **Jost**, unchanged, `preload: false`.
- `marketingFontPreload.wiring.test.ts` still needs one `preload: true` and one `preload: false` literal in the file.

The script word comes from a separate dictionary key (`titleScript`) so each locale controls it. A section with no `titleScript` renders the serif title alone.

### Ornaments (restrained, per `44-no-ai-slop-design.mdc`)

- Hairline with a small centered heart (`LioraHeartRule`), at most once per section, under the title.
- Photos fade into the paper with a radial mask (`.liora-photo-fade`) instead of hard arches. The hero photo keeps a full-bleed treatment.
- Age pills (rose-deep fill, white text) only where the flyers use them: class ages in Clases.
- Round rose icon badges (44 px) for schedule, place, and trial class rows in Clases and Horarios. Lucide icons inside, `aria-hidden`.
- No sparkle or heart confetti. No chip rows. No repeated uppercase eyebrows: the kicker survives only in the hero.

## Horizontal logo lockup

New molecule `src/components/molecules/LioraLockup.tsx`:

- Inline SVG dancer (`LioraDancerMark`, atom) drawn in the logo's fine-line style, stroke `currentColor`, rose-deep.
- Text: `brand.name` split into the wordmark, rendered as text (not an image), with `STUDIO` in rose-deep. The split rule: last word in rose-deep with wider tracking. Brand strings come from the brand layer, not literals.
- Motto line from the dictionary key `landing.liora.chrome.motto` (es "Danza · Movimiento · Pasión", en "Dance · Movement · Passion", pt "Dança · Movimento · Paixão").
- Prop `compact` (boolean). Compact hides the motto and shrinks the figure. This is the one place a boolean is fine: it is a size state, not a variant fork.

`LioraSiteHeader`:

- Replace the `<img>` with `LioraLockup`. Keep `logoAlt` as the link `aria-label`.
- Add `useScrolledPast` (as `MatissSiteHeader` does). `data-scrolled` drives padding, background opacity, and a soft shadow. Transition 300 ms, `cubic-bezier(0.22,1,0.36,1)`.
- Drop the `logoSrc` prop. Callers stop passing it. `brand.logoPath` stays used by the hero mark, footer, and JSON-LD.
- Restyle links and buttons to the new tokens. All targets stay ≥ 44 px.

The square PNG logo stays in the hero (small, above the title) and in the footer. Rule `47-page-brand-seo.mdc` is met by the lockup on every page.

## The ribbon and the dancer

### Units

1. **`src/lib/landing/lioraRibbonPath.ts`** (pure). Input: section anchor points `{ y, side: "start" | "end" }[]`, container width, and a margin. Output: an SVG path `d` string of smooth cubic curves that weave between the sides. Also exports `LIORA_RIBBON_POSES`: the ordered pose per section id (`hero: arabesque`, `sobre: pirouette`, `clases: pirouette`, `sedes: grandJete`, `horarios: attitude`, `galeria: saute`, `cta: reverence`). No DOM, no React.
2. **`src/components/atoms/LioraDancerPose.tsx`**. One inline SVG per pose name, same stroke and size. Pure render.
3. **`src/hooks/useLioraRibbon.ts`**. Measures the section anchors with `ResizeObserver`, builds the path, and tracks scroll progress.
   - Progress is written to a CSS custom property on the overlay (`--liora-ribbon-progress`) inside one `requestAnimationFrame` per scroll event. No React state per frame.
   - The active pose changes through `IntersectionObserver` on sections (rootMargin centered). Only that changes React state.
   - Reduced motion (`prefers-reduced-motion: reduce`) or no `IntersectionObserver`: the ribbon is fully drawn and static, and the dancer sits at the hero in arabesque.
4. **`src/components/organisms/LioraRibbonOverlay.tsx`** (client). An absolutely positioned SVG behind the content (`pointer-events: none`, `aria-hidden`, `z-0`; section content is `z-10`).
   - The ribbon is a `<path>` with `pathLength="1"` and `stroke-dashoffset: calc(1 - var(--liora-ribbon-progress))`.
   - The dancer rides the tip with CSS `offset-path: path(...)` and `offset-distance: calc(var(--liora-ribbon-progress) * 100%)`.
   - When the pose changes, the old pose fades and the new one fades in over 400 ms (CSS opacity plus a slight rotate). A pirouette pose adds one 360° turn, which is skipped under reduced motion.
   - Browsers without `offset-path` (feature query `@supports not (offset-path: path("M0 0"))`) show only the ribbon.

### Layout so the dancer never crosses copy

- Section text blocks alternate sides on `lg` and up (hero start, sobre end, clases start, sedes end, horarios start, galeria full width with the ribbon in the top gutter, cta center).
- The ribbon passes through the opposite side's gutter. On screens below `lg` the weave narrows to the outer 24 px margin on each side, and the dancer scales to 60 %.
- The gallery and the contact form are full width. The ribbon passes above them in the section top padding (`py-24` already reserves that space).

### Performance

- One SVG, one path, one dancer group. No scroll-linked layout reads per frame: anchors are measured on resize only.
- The overlay mounts after hydration (`useEffect`), so it does not affect LCP. The hero photo stays the LCP element.
- No new dependency. CSS `offset-path` and `stroke-dashoffset` only.

## Section changes

| Section | Change |
|---|---|
| Hero | Keep the photo. Overlay becomes a blush-to-transparent wash on the text side. Add the small square logo above the title. Title in Playfair, with a script second line. Buttons: filled rose-deep and outline rose-deep. Text side `start`. |
| Sobre | Text `end`, photo with `.liora-photo-fade`. Pillars keep their icons, restyled. Script word on the title. |
| Clases | Flyer cards: age pill, serif title with a script age line ("de 3 a 4 años"), faded photo, and rows with round icon badges (day and time, place, trial class). Text `start`. |
| Sedes | Text `end`. Keep the flyers. Restyle borders and buttons. |
| Horarios | Text `start`. Table restyled with the blush band and rose-deep headers. |
| Galería | Strip from the previous change, restyled. Frames get a soft blush glow. |
| CTA / contacto | Centered, with a heart rule. The dancer lands in révérence beside the title. |
| Footer | Ink band, with the cream square logo and the motto. |

New dictionary keys (en, es, pt) under `landing.liora`: `chrome.motto`, and `titleScript` for `hero`, `sobreNosotros`, `clases`, `sedes`, `horarios`, `galeria`, and `cta`. The overlay is decorative and `aria-hidden`, so it has no label. Spanish uses neutral tuteo.

## Surfaces (Web vs PWA)

Liora has no `src/components/pwa/` tree and no `useAppSurface` branch. It is a public Tier A marketing page that already ships one tree, with layout that differs by breakpoint only: the header has a mobile sheet, and sections stack. This change keeps that model:

- **Web (`web-desktop`)**: alternating sides, full weave, dancer at 100 %.
- **Narrow (`web-mobile` / `pwa-mobile`)**: stacked sections, the ribbon in the outer margins, dancer at 60 %, header compact by default, menu sheet with 44 px rows and a safe-area bottom pad (already in place).
- Shared components touched (`LioraFontRoot`, `LioraSiteHeader`) are used by blog, contact, register, privacy, and answer pages. Removing `logoSrc` requires updating every caller in the same change. The tests `PublicTenantChrome.test.tsx` and `RegisterLioraSurface.test.tsx` are in the test plan.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| The ribbon distracts from the content or crosses text | Alternating layout, decorative stroke at 1.5 px, low opacity at the tail, and reduced motion gives a static ribbon. |
| Scroll jank | CSS variable written in rAF, anchors measured on resize only, no React state per frame. |
| Contrast regressions with the bright rose | Rose `#e48a94` is decorative only. Text uses the deeper tones in the table. A unit test checks the token pairs. |
| Header lockup with a long `brand.name` | The lockup truncates the motto first, then hides it below `sm`. |
| Fonts add weight | Allura is one weight, not preloaded. Cormorant leaves. |
| Files above 250 lines | `LandingLioraSections` splits the hero and sobre into their own organisms. `lioraLanding.css` splits ribbon styles into `lioraRibbon.css`. |

## Tests (TDD, self-contained)

- `lioraRibbonPath.test.ts`: the path starts at the first anchor and ends at the last; the sides alternate; one anchor gives a straight segment; an empty list gives an empty string.
- `LioraLockup.test.tsx`: renders the brand name and the motto; `compact` hides the motto.
- `LioraSiteHeader.test.tsx`: no `<img>` logo, the link has `logoAlt`, and `data-scrolled` flips when the sentinel leaves (mocked `IntersectionObserver`).
- `LioraRibbonOverlay.test.tsx`: `aria-hidden`; under reduced motion the pose is `arabesque` and the progress is 1; the pose changes when a section intersects.
- `LioraDancerPose.test.tsx`: each pose name renders an SVG; an unknown name falls back to arabesque.
- `lioraPalette.test.ts`: reads the token values from `lioraLanding.css` and asserts the AA ratios in the table.
- Update the existing Liora tests: `PublicTenantChrome`, `RegisterLioraSurface`, `LandingLioraFooter`, `LioraLandingGallery`, and the font wiring test.

## Changelog

New `supabase/pulsar-migrations/024_liora_redesign_changelog.sql`, id `liora-instagram-redesign`, area `site`. Applied to Pulsar.

## Definition of done

- The Liora pages use the new palette and fonts. Every text pair in the table passes AA.
- The sticky header shows lockup C and turns compact on scroll.
- The rose ribbon draws with scroll, the dancer rides its tip and changes pose by section, and the dancer never covers text at `lg` and up.
- Under reduced motion the ribbon is static and nothing turns.
- Tests above pass. `npm run lint`, typecheck, and `next build` pass.
- Changelog row is applied.
- Manual QA (user): scroll the home on desktop and phone; check the header on blog, contact, and register; check reduced motion in the OS settings.

## Out of scope

- A new square logo or a vector redraw of the official logo PNG.
- Instagram feed embedding.
- Other tenants.
- The gallery strip behavior (already done in the previous change, not yet committed).
