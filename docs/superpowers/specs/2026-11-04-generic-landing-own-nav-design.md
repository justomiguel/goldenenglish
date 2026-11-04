# Generic free-site landings own their page

**Intent:** A free site on its own domain shows a landing that belongs to that institute. The top bar scrolls to real sections on that page. The page does not show login, and it does not use CentroListo chrome or CentroListo routes.

**Done when:**

- The five kinds (deportes, jardín, colegio, música, idiomas) hide the shared `LandingHeader`, `LandingHeaderPwa`, `LandingFooter`, `LandingFooterPwa`, and the PWA tab bar.
- Each landing draws its own sticky bar: logo, institute name, and links to sections that exist on the page.
- Every nav link is an in-page anchor. The matching element has the same `id`.
- A hidden CMS section is absent from the bar and from the page.
- The bar has no login, portal, or logout control.
- The page has no link to `/login`, `/dashboard`, `/events`, `/blog`, `/tienda`, `/register`, `/contact`, `/preguntas`, or a CentroListo host.
- The only off-page links are `mailto:`, `tel:`, and the institute social URLs stored on that site.
- The header action uses the existing trial or visit sentence and goes to `#contacto`.
- The footer shows the institute name and only the contact fields that have a value.
- Web and narrow layouts both use this bar. Narrow uses a menu. Targets are at least 44px.
- The five compositions stay different from each other. They use the template palette and the photos already on the page.
- Branded landings (Nago, Mozarthitos, Mimundo, Liora, Espacio Zenit, classic) keep their current header, footer, and login.

**Out of scope:** New photographs. Video. A booking calendar. Login for later. Legal pages. Changing CentroListo marketing. Changing the five section sentences except a nav label for Inicio and Contacto.

## Context

`LandingHeader` links to `#historia`, `#modalidades`, `#niveles`, `#certificaciones`, and `#contacto`, plus events, blog, and shop. `LandingMainSectionsGeneric` never sets those ids, so the links do not move the page. The same header always renders `PublicHeaderAccountCta`, which goes to `/{locale}/login`.

Free sites are separate hosts. That header and the PWA tab bar are the product shell. They do not belong on the institute domain.

The 2026-11-02 rich-template spec said not to add a second header. This spec replaces that decision for the five generic kinds only.

## Decision

The generic landing is self-contained. The home page and `/plantilla/{kind}` suppress the shared shell and render `GenericLandingNav` plus a short footer inside the landing tree.

## Options

1. **Fix the shared header for generic kinds.** Rejected. That header still knows about login, events, blog, and shop.
2. **Own bar and footer inside the generic landing.** Chosen. The institute page does not import CentroListo chrome.
3. **Five unrelated page designs.** Rejected. One nav contract and one photo set stay. The layout of each kind changes.

## Surfaces (Web vs PWA)

Public home is Tier A. Both surfaces exist today through `LandingSurfaceGate` and `PublicExperienceFrame`.

- **Web (`web-desktop`):** hide `LandingHeader` and `LandingFooter`. The sticky bar sits on the landing. Links stay in one row. The logo returns to `#inicio`.
- **PWA (`web-mobile` and `pwa-mobile`):** hide `LandingHeaderPwa`, `LandingFooterPwa`, and `PublicPwaTabBar`. The same bar collapses to a button and a list of the same anchors. The installed top bar does not add a login control on these pages. Safe area padding stays on the bar.
- Shared props for branded headers do not change.

## Navigation

Ids, in order:

| Id | Label source |
|---|---|
| `inicio` | new dictionary key |
| `historia` | `landing.genericSectionLabels.historia` |
| `oferta` | `landing.genericSectionLabels.oferta` |
| `modalidades` | `landing.genericSectionLabels.modalidades` |
| `niveles` | `landing.genericSectionLabels.niveles` |
| `certificaciones` | `landing.genericSectionLabels.certificaciones` |
| `contacto` | new dictionary key |

`inicio` and `contacto` are always present. The five middle links follow the visible bands. The close block owns `id="contacto"`. The hero owns `id="inicio"`.

## Look

Keep one kicker, the scene line. No pill row, no three stat cards, no icon squares, no before/after pair.

| Kind | What changes |
|---|---|
| deportes | The bar is a dark strip in the primary color. The day reads as a schedule: time, then the line. Bands stay full width and swap sides. |
| jardin | The bar is paper with a hairline. The split hero stays. The day is one vertical rule. Photos stay large. |
| colegio | The bar is an index under the name. Sections are numbered ruled rows, not cards. |
| musica | The bar and the hero share the primary field. The day stays a recital list. The close returns to that field. |
| idiomas | The bar is a short word list on paper. The title stays large. Photos break the text. |

Colors still come from the template palette. Do not add hex values in the components.

## Tests

- A deportes render exposes the seven anchors and seven matching ids.
- A hidden `niveles` section removes that anchor and that block.
- The render has no control named with the login dictionary string.
- The render has no `href` that contains `/login`, `/events`, `/blog`, or `/tienda`.
- A classic or Nago header test still finds its login control.

## Manual QA (user)

- Open a free site host and a `/plantilla/{kind}` preview.
- Each bar link scrolls to that section.
- Login is absent on desktop and on a narrow window.
- The other five branded homes still show their own header.
