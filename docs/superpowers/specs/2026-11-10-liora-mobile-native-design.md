# Liora landing — native mobile and PWA experience

## Intent

The Liora landing does not fit narrow screens, and on a phone it reads as a desktop page made smaller. Fix the overflow. Then make the narrow surfaces (`web-mobile`, `pwa-mobile`) behave like an installed app: one header, one bottom tab bar, swipe gestures, one prompt at a time, and a first screen that shows the main button.

The user asked for this spec on 2026-11-10 after a review of the mobile captures.

## Evidence

Measured on 2026-11-10 at `http://liora.localhost:3000/es`, Playwright, iPhone 13 profile at 390 x 760 and 360 x 740.

| # | Finding | Cause |
|---|---|---|
| 1 | The menu button is off screen at 390 and 360 (x 403–447). At 360, "Ingresar" is cut to "Ingre…". | `LioraSiteHeader`: the logo link has `shrink-0`, so the lockup (about 290 px wide before scroll) cannot shrink and pushes the actions out. |
| 2 | No hero button shows complete on the first screen. "Agenda tu clase de prueba" is under the tab bar. | Hero has three stacked buttons and its height ignores the header and the tab bar. |
| 3 | On the first visit, two layers cover the page: the events modal, then the "Instala la app" sheet. | `HomeEventPopup` and `PwaInstallPromptHost` open independently. |
| 4 | "Ingresar" shows in the header and in the tab bar. | Header account CTA renders at all widths. |
| 5 | The logo shows twice: lockup in the header, square logo in the hero. | `LandingLioraHero` renders `brand.logoPath`. |
| 6 | The gallery cannot be swiped. Only the arrow and pause buttons move it. | `.liora-gallery-track` moves with `transform`; there is no touch or scroll handling. |
| 7 | The ribbon line crosses paragraphs in "Nosotras", "Clases", and "Galería". | The narrow ribbon path still crosses the content column. |
| 8 | Page height is 11,771 px, about 15.5 screens. Clases is 3,000 px. Sedes is 1,840 px. | Four full-height class photos. Each sede shows a logo flyer as a large photo. |
| 9 | The motto is 9.6 px. Card descriptions are about 12 px. Footer links are 20 px high. | Desktop sizes are kept on narrow screens. |
| 10 | The tab says "Cursos". The section says "Clases". | The tab label falls back to `dict.nav.courses`. |
| 11 | In the installed app, two headers stack: the generic `PublicInstalledTopBar` and `LioraSiteHeader`. | `PublicExperienceFrame` adds its top bar for every variant when installed. |

The black "N" badge over "Inicio" is the Next dev indicator. It does not show in production. Not in scope.

## Surfaces (Web vs PWA)

Tier A public marketing. Liora has no `src/components/pwa/` tree. The landing renders inside `PublicExperienceChrome` (`PublicExperienceFrame` + `PublicPwaTabBar`, tab bar `md:hidden`).

### Web (`web-desktop`)

No change, except the shared fixes that are correct on every width:

- The logo link can shrink below `xl` (finding 1).
- Card descriptions use the new minimum text size (finding 9).
- Header fit (found during implementation): the lockup, nine links, two icons, and the account button did not fit the 1152 px container at any desktop width, so "Iniciar Sesión" went past the right edge. The full link row now shows from `xl` (the menu button covers `md` to `xl`), the header container is `max-w-7xl`, and the Instagram and WhatsApp icons show from `2xl`. Both icons stay in the footer.

The hero square logo, the three hero buttons, the ribbon weave, the transform gallery, and the full footer stay as they are on desktop.

### Narrow (`web-mobile` / `pwa-mobile`), below `md`

| Area | New behavior |
|---|---|
| Header | Compact lockup: dancer figure and `LIORA STUDIO`, no motto. Right side: the menu button only. No "Ingresar", because the tab bar has it. The menu sheet keeps the section links (Nosotras, Sedes, Horarios, Galería, Contacto), which the tab bar does not have. |
| Installed app | One header. `PublicExperienceFrame` does not render `PublicInstalledTopBar` for the `liora` variant, because the Liora header is already sticky and has safe-area padding. |
| Hero | No square logo. Height is the first screen minus the header and the tab bar (`100svh` based). The first register CTA is a full-width primary button, complete above the tab bar. The second register CTA becomes a text link under it. "Ver horarios" is removed on narrow. |
| First visit | One layer at a time. The events modal does not open on narrow. A compact "Próximo evento" card renders after the hero instead (image, title, date, place, button to the event). The install sheet opens only after the visitor scrolls past the hero, and never while another dialog is open. |
| Clases | Native horizontal scroll with `scroll-snap`, one card plus a part of the next one in view. Photo at 4:3. All four cards stay in the DOM. |
| Sedes | One compact row for each sede: name, metro line, description. No image on narrow while the image is the logo flyer. |
| Galería | Native horizontal scroll with `scroll-snap` and swipe. The counter ("4 de 21") follows the scroll position. Autoplay stops at the first touch and does not restart on its own. Tap opens the existing full-screen viewer. Arrow buttons are removed on narrow. |
| Ribbon | Hidden below `md`, with the dancer. The ribbon stays on desktop. This changes the narrow rule in `2026-11-10-liora-redesign-design.md` ("ribbon in the outer margins"), because the captures show it crosses text. |
| Text | Minimum 14 px for body and card text. Motto hidden on narrow. |
| Footer | Keep: logo, short description, contact, sedes, social, language, and legal links (Privacidad y términos, Preguntas). Remove the "Enlaces" section list and "Iniciar Sesión", because the menu and the tab bar have them. Every link row is 44 px high or more. |
| Tab bar | Liora passes its own courses label, so the tab says "Clases" in es (en and pt from the Liora copy). The tab bar component does not change. |

Gallery and Clases have different interactions on each surface, so each has a narrow component behind `SurfaceMountGate`. The other areas use one component with breakpoints.

Pages that share `LioraSiteHeader` (blog, contact, events, register, privacy, answer) get the same header fix. That is intended.

## Analytics

- Keep every existing event on the hero CTAs, the event popup, and the install prompt.
- The inline event card sends the same event as the popup button. If the popup has no event, the plan adds one through the existing tracker.
- No new event for gallery swipes.

## Done when

- At 360 and 390 px, `document.documentElement.scrollWidth` equals the viewport width, and the header menu button is inside the viewport.
- On narrow, the first screen shows one complete primary button above the tab bar.
- On narrow, the events modal does not open, the event card renders after the hero, and the install sheet does not open before the visitor scrolls past the hero.
- On narrow, the header has no account button and the hero has no logo image.
- In the installed app, only one header renders on the Liora landing.
- The gallery and Clases scroll with swipe on narrow. The gallery counter matches the scroll position.
- The ribbon layer does not render below `md`.
- No body text below 14 px on narrow. Footer links are 44 px high or more.
- The Liora tab says "Clases" in es.
- Desktop at 1280 px shows no visible change except the header fit and the text size. The header controls stay inside the viewport from 768 to 1600 px.
- New copy exists in en, es, and pt. Spanish uses neutral tuteo.
- A changelog entry describes the visible change.
- Lint, typecheck, unit tests, and precommit E2E pass.

Target, not a gate: about 9 screens at 390 x 760 (now 15.5).

## Tests (TDD, self-contained)

- `LioraSiteHeader.test.tsx`: the logo link can shrink; on narrow, no account CTA renders; the menu button renders; the link row shows from `xl`.
- `PublicExperienceFrame` test: installed and `liora` variant → no `PublicInstalledTopBar`; other variants keep it.
- `LandingLioraHero` test: narrow → no logo image, one primary CTA, the second CTA as a link, no "Ver horarios".
- Narrow gallery test: all slides in the DOM, a scroll event updates the counter, a touch stops autoplay, no arrow buttons.
- Narrow Clases test: four cards in a snap list.
- Sedes test: narrow rows render without images.
- Event card and popup test: narrow renders the card and not the dialog; desktop keeps the dialog.
- Install prompt test: no sheet before the hero leaves the viewport; no sheet while a dialog is open; a hero replaced after mount is still found.
- `LioraRibbonOverlay.test.tsx`: does not mount below `md`.
- Footer test: no "Enlaces" list on narrow; legal links remain.
- Tab label test: Liora passes the "Clases" label.
- Manual Playwright captures at 360, 390, 768, 1024, 1280, 1440, and 1600 px: no horizontal overflow, header controls in view. The precommit E2E server serves one test tenant, so this check is not in the precommit suite.

## Out of scope

- The desktop design of the Liora landing.
- `PublicPwaTabBar` label size (10 px) and design. It is shared by every themed tenant.
- Install prompt and event popup behavior for other tenants. The new gating applies only when the page passes it.
- Real sede photos. The client can upload them later in the CMS (`modalidades` slots). The narrow rows can show them in a later change.
- The Next dev indicator.

## Risks

| Risk | Mitigation |
|---|---|
| `SurfaceMountGate` swaps the gallery and Clases after hydration and moves content. | Both sections are below the first screen. Reserve their height. |
| Removing the installed top bar removes its language switch. | Liora keeps the language switch in the footer. |
| A visitor who never scrolls never sees the install sheet. | Accepted. The sheet is secondary to the trial class button. |
| The ribbon on narrow was an approved decision. | This spec changes it on purpose. The user approves this spec. |
| Files above 250 lines. | Narrow components go in their own files. `LioraLandingGallery` (234 lines) does not grow. |

## Plan outline

The full plan goes in `docs/superpowers/plans/2026-11-10-liora-mobile-native.md` after approval.

1. Header shrink fix and narrow header, with tests.
2. Installed top bar rule for the `liora` variant.
3. Hero narrow layout.
4. First-visit sequence: event card, popup gate, install prompt gate.
5. Narrow Clases and narrow gallery behind `SurfaceMountGate`.
6. Sedes rows, ribbon off on narrow, text sizes, footer.
7. Tab label, copy in en/es/pt, changelog entry.
8. Checks, captures at 360/390/1280, one commit with spec, plan, and code.
