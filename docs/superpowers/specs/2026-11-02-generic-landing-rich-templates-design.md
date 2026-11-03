# Rich generic institute landings

**Intent:** The five CentroListo templates (deportes, jardín, colegio, música, idiomas) read as full institute homepages. Each kind has its own composition, more sections, and quiet motion.

**Done when:**

- `/es/plantilla/{kind}` shows a full-bleed page, not a narrow stack of captions and photos.
- Each kind uses a different composition. The five pages do not share one layout with swapped photos.
- The page still shows the hero and the five CMS sections: historia, oferta, modalidades, niveles, certificaciones.
- A hidden CMS section stays hidden.
- An admin photo for `inicio` or a section still replaces the stock file.
- Chosen template colors (primary, accent, paper) still paint the page through CSS variables.
- Motion runs once on enter. `prefers-reduced-motion: reduce` leaves the page still.
- Copy for the new lines exists in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo.
- The words are the academy speaking about its own classes, ages, schedule, and a visit or trial class. They are original. They do not describe the software.
- The picker screenshots `public/generic/{kind}/preview.jpg` are recaptured after the layout change.
- The large preview and `/plantilla/{kind}` show a loader with a percent until the template page is ready. The percent reaches 100 when the preview has loaded.
- Existing branded landings (Nago, Mozarthitos, Mimundo, Liora, Espacio Zenit, editorial, minimal) stay unchanged.

**Out of scope:** New photos. Video. Pricing tables. Booking widgets. A second header. Stats, pill rows, icon-in-a-box grids, and before/after cards.

## Context

`LandingMainSectionsGeneric` is one column: a title, one image, then five figures. Published generic sites and the CentroListo preview both render that component.

Academy and school homepages from 2025 (sports academies, music schools, community studios) open with a large photo, then the day or the groups, then a close with one action. This spec keeps that sequence. The drawings are original. Colors come from the template palette.

## Options

1. **One richer layout for every kind.** Fast. The five templates still look like one page.
2. **Five compositions, one motion helper, the same six photos.** Recommended. Each template is recognizable in the picker.
3. **Paste a third-party template.** Rejected. Those files ship stat walls, pills, and hex colors outside the brand layer.

## Surfaces (Web vs PWA)

Public home is Tier A. `LandingSurfaceGate` already splits the shell: `LandingScreenDesktop` on wide, `PwaPageShell` plus `LandingHeaderPwa` on narrow. The generic body is the shared `main` in both shells.

- **Web:** wide compositions below. The preview route `/plantilla/[kind]` keeps `LandingScreenDesktop`.
- **PWA / narrow:** the same sections, stacked, full width, type one step smaller. No hover-only control. Touch targets stay at least 44px. The PWA header and footer stay as they are.
- Do not add a second generic organism. The header trees stay compatible because this change does not edit their props.

## Compositions

Shared pieces, each under 250 lines:

- `GenericLandingHero` — photo, scene time, title, body.
- `GenericLandingDay` — three short lines (arrival, middle, close).
- `GenericLandingBands` — the five CMS sections. A hidden section is omitted.
- `GenericLandingClose` — later title, later body, contact, one link to `/{locale}/contact`.
- `GenericLandingMotion` — client. Reveals a block once when it enters the viewport.

`LandingMainSectionsGeneric` only chooses the composition and passes props.

| Kind | Hero | Day | Bands | Close |
|---|---|---|---|---|
| deportes | Photo fills the first screen. Title sits on a scrim. Scene time is the only kicker. | Three rows, hairline between them, times on the left. | Full-width bands. Photo and text swap sides each band. | Paper band, contact, link. |
| jardin | Split. Photo on the left, story on the right. No scrim. | Vertical rhythm with a single rule. | One large photo, then two smaller photos. Text under each. | Quiet paper note and the link. |
| colegio | Masthead: name, then title, then a full-width photo. | Three lines under a rule, like a prospectus. | Each section is a ruled row: small photo, label, one sentence. | Same close as deportes, narrower measure. |
| musica | Primary-colored field. Photo sits in a frame beside the title. | Three lines set like a recital order. | Bands return to the paper background. | The primary field returns for the close and the link. |
| idiomas | Large title on paper, photo below, cropped to the top of the frame. | Four short steps in one column (not cards). | Photo break between step groups, using the CMS images in order. | Contact under the last photo. |

One kicker on the page: the scene time. No second uppercase label. No metric row under the hero.

## Motion

- Hero photo scales from 1.04 to 1 in 1.1s, ease `cubic-bezier(0.22, 1, 0.36, 1)`, only on first paint.
- Each day row and each band fades and rises 12px when it enters, once, 480ms, same ease. Rows stagger by 70ms.
- Música does not bounce the frame.
- Reduced motion: no scale, no rise, full opacity.

## Copy and CMS

Add per kind, in `landing.genericLandings.{kind}`:

- `rhythmA`, `rhythmB`, `rhythmC` — one short sentence each.
- `sections.historia`, `sections.oferta`, `sections.modalidades`, `sections.niveles`, `sections.certificaciones` — one sentence each.

Section headings stay `landing.genericSectionLabels`.

`genericLandingCopyKeys` returns the new sentence key for that section plus the shared label, so the CMS can edit the sentence. `inicio` keeps the current page fields and also returns the three rhythm keys.

Empty contact fields stay hidden. The contact link remains.

## Color

Components use `var(--color-*)` only. The scrim is `color-mix` of `foreground` and transparent. No hex in TSX. The iframe preview query (`primary`, `accent`, `paper`) keeps working.

## Tests

- Each kind renders the h1, the hero `src`, and the five section images.
- A custom `heroSrc` wins.
- A hidden section omits that image.
- Rhythm line A is visible.
- `genericLandingCopyKeys("deportes", "historia")` includes the new sentence key.
- Motion helper adds no transform when `matchMedia("(prefers-reduced-motion: reduce)")` matches.

## Risks

- The picker thumbnail is `object-top` of a 1440×900 capture. Recapture after the layout or the card shows the old page.
- New dictionary keys must match in en, es, and pt or `Dictionary` breaks the build.
- A wide hero inside `PwaPageShell` must not overflow horizontally.

## Manual QA (user)

Reload `/es/plantilla/deportes` and one other kind. Check hover is not required. Change a color in the create form and confirm the large preview follows it. On a phone-width window, confirm the stack and the contact link.
