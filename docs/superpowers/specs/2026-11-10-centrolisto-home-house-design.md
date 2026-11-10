# CentroListo home — the school’s house

**Intent:** Rebuild the CentroListo home as six screens. The first screen is one real client site. Two screens move. The other screens stay still.

**Done when:** The home shows the six sections below, in that order, on desktop and on the narrow chrome. The hero names the page, the list, and the monthly charge. The live client count is on that first screen. The only home button is the free page. Scroll does not fade sections in. The logo draws once. Sunday changes the same site frame. Day 5 draws one total.

**Out of scope:** `/precios`, `/producto`, `/clientes`, `/contacto`, and the segment pages. New photography. A shader, a video, or a second logo animation. New analytics events. An ADR. Authenticity of the six quotes on `/clientes`.

This spec replaces the home order and the home motion in `2026-11-07-centrolisto-landing-reorder-design.md`. Prices stay on `/precios`. The six quotes stay on `/clientes`.

## Kind

Software. The subject is the school’s public site and the one list that continues into the charge. The buyer is the owner of an academy, a language institute, a dance or music school, a dojo, or an early-childhood space.

## Evidence

Read on 2026-11-10 at `http://localhost:3000/es`.

| Measure | Now |
|---|---|
| Document height at 1440 px | 9049 px |
| Home headings | Nine `h2` elements |
| Hero | Split title plus three floating images that follow the pointer |
| Home also shows | Three price columns, a quote carousel, and two numbered 1-2-3 blocks |

`clients/espaciozenit.jpg` and `clients/golden.jpg` are the only full client-site stills under `public/centrolisto/`. `moments/class.webp` and `moments/family.webp` already exist.

## Copy

Add or replace keys in `en.json`, `es.json`, and `pt.json`. Spanish in `es.json` uses neutral tuteo. Do not hardcode the sentences in components.

| Place | Spanish |
|---|---|
| `home.title` | La página, la lista y la mensualidad de tu academia. |
| `home.fact` | {count} academias ya cobran aquí. |
| Hero button | Keep `home.freeSiteCta` |
| Sunday label | Domingo, 21:40 |
| Sunday line | La familia toma el cupo. El nombre queda en la lista. |
| Tuesday label | Martes, antes de clase |
| Tuesday line | El profesor marca la asistencia en el teléfono. |
| Day 5 label | Día 5 |
| Day 5 line | Dos hermanos. Un cobro. |
| Friday label | Viernes por la tarde |
| Friday line | La familia abre el teléfono y ve el escudo de la escuela. |
| Close title | Crea la página de tu academia. |

Remove the home eyebrow “La plataforma para academias, escuelas e institutos” from the hero. Do not use “en una sola plataforma”, “todo conectado”, or “más tiempo para enseñar” on this page.

`{count}` is `activeTenantCount` from the current home props. Do not freeze the number 7 in the dictionary.

Day 5 shows two sibling rows and one total. Those amounts are scene copy. They are not a client metric. Do not name Flow, Mercado Pago, or a real family.

## Sections

Each section is one idea. On a 1440×900 desktop screen the section fills that screen and does not show the next heading. On a narrow screen the section stacks and grows with its content.

1. **Hero.** `clients/espaciozenit.jpg` fills the screen. Do not use `hero-editorial.jpg`. Do not float `admin-hub.jpg` or a second site card. The title, the count, and `home.freeSiteCta` sit on the still. One button.
2. **Sunday.** The same site frame. The frame changes once from the public page to the enrollment state: the seat closes and one list row appears. No second photograph.
3. **Tuesday.** The teacher’s phone shows the attendance list. `moments/class.webp` is the class photograph beside it on desktop and under it on narrow screens.
4. **Day 5.** Two sibling rows join one charge. The total stroke draws once.
5. **Friday.** A phone shows the school crest. `moments/family.webp` is the photograph. No caption under the photograph.
6. **Close.** The close title and the same free-page button. No WhatsApp button. No demo button. No price columns.

Delete these from the home render: `PulsarHomeProof` as a logo wall, `PulsarSolutionShowcase`, `PulsarHomeBenefits`, `PulsarHomeIdentity`, `PulsarVoiceCarousel`, and `PulsarHomeHow`. Keep the components if `/precios` or `/clientes` still imports them.

The hero still is Espacio Zenit because that file is already a published client site and it does not add the child-photo question recorded for `clients/golden.jpg`.

## Motion

Easing stays `cubic-bezier(0.22, 1, 0.36, 1)`. `prefers-reduced-motion: reduce` shows the finished state and runs no animation.

| Moment | Behavior |
|---|---|
| Load | The site still is visible. The title enters once. `CentroListoLogoMark` draws the loop and the seed once, then stops. |
| Sunday | The same frame swaps to the enrollment state once. |
| Day 5 | The total stroke draws once. |
| Pointer | A linked card lifts 2 px. A photograph zooms to 1.03 inside its frame. The button darkens and presses. An underline draws. |
| Scroll | Sections do not fade, slide, or mask in. |

Remove pointer tracking on `PulsarHeroStage` (`--cl-x`, `--cl-y`). Remove the home price hover that lifts 6 px and scales. Remove the quote carousel from the home. Do not autoplay tabs. Do not count up a number.

Sunday and Day 5 start when that section enters the viewport, and they run once. They do not replay on later scrolls.

## Surfaces (Web vs PWA)

Tier A public marketing. The home renders inside `PulsarSiteChromeEntry`. `PulsarSiteChromePwa` is the narrow chrome. There is no second home tree. One section component stacks under the narrow breakpoint.

### Web (`web-desktop`)

- The hero still fills the first viewport. The title block sits on the still. It does not sit in a second column of floating cards.
- Tuesday places the phone and `moments/class.webp` side by side.
- Friday places the phone and `moments/family.webp` side by side.
- Each section is one viewport tall. The next `h2` does not enter that viewport.

### Narrow web and PWA (`web-mobile` / `pwa-mobile`)

- The same six sections stack in one column.
- The hero still fills the first screen. The title, the count, and the button stay inside that screen.
- Tuesday and Friday place the photograph under the phone.
- The two moments run once without a hover.
- Buttons and links are at least 44 px tall.
- `PulsarSiteChromePwa` keeps the top bar, the bottom navigation, and the safe-area padding.
- The bottom bar does not cover the hero button.

Shared props, the dictionary, and the free-page action stay the same for both surfaces.

## Analytics

Keep `cl_create_free_page` on the hero button and on the close button. Do not add an event for Sunday or Day 5. Do not fire `cl_demo_gestion`, `cl_demo_ecosistema`, or `cl_quote_custom` from the home, because those controls leave this page.

## Tests

Add or update a self-contained Vitest file for the home.

- The six sections render in order.
- The hero title is the new sentence.
- The fact includes the count passed in props.
- The home has one button label, the free page, twice (hero and close).
- The home does not render price columns, quote arrows, or the old eyebrow.
- Reduced motion is covered by asserting the motion classes do not include the pointer-shift stage.

Update `PulsarLandingPages` tests that still expect the old home order.

## Changelog

Staff and owners will see a different home. The implementation commit adds one `platform_changelog_entries` row under `supabase/pulsar-migrations/`. Area: `site`. The sentence says the CentroListo home now opens on a school site and follows one list through enrollment and the monthly charge.

## Risks

| Risk | Mitigation |
|---|---|
| `2026-11-07-centrolisto-landing-reorder-design.md` still asks for prices and six quotes on the home. | This spec replaces that home order. Do not implement both. |
| Espacio Zenit changes its public site after the still was saved. | Use the file already in the repo. Do not hot-link the live site. |
| A 900 px section clips on a short laptop. | Allow the section to grow. Do not hide the button or the count. |
| Other WIP touches `PulsarLandingHome` or the dictionaries. | Stop and ask. Do not stash. |

## Plan outline

The plan file is `docs/superpowers/plans/2026-11-10-centrolisto-home-house.md` after this spec is approved.

1. Write the failing home test for order, copy, and the absent blocks.
2. Add the dictionary keys in en, es, and pt.
3. Replace the home composition with the six sections.
4. Replace the home motion. Keep reduced motion.
5. Adjust the narrow chrome so the bottom bar does not cover the hero button.
6. Add the changelog migration.
7. Run the home Vitest file.
