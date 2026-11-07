# CentroListo landing reorder

## Intent

Show the product in the first screen. Remove repeated sections. Give each section its own image. Replace motion that delays or repeats content with short, single-purpose motion.

The user approved the section order and kept all six testimonials with a new format (2026-11-07).

## Evidence

Measured on 2026-11-07 on the local server, unless a line says otherwise.

| Measure | Now |
|---|---|
| Home height, desktop at 900 px | 10.1 screens |
| Home height, narrow at 844 px | 15.4 screens |
| Places that use `public-site.jpg` or `admin-hub.jpg` | 14 |
| Main hero button, complete | 1620 ms after first paint (from CSS) |
| Testimonial arrows | No effect. `scrollLeft` stays 0 after a click. |
| HTML on production | 890 KB uncompressed, 220 KB compressed, `no-store` |

## New home order

1. Hero.
2. Client logos and count.
3. Four scenes.
4. Your brand, with the site and the panel of one institute, plus the client cards.
5. Six testimonials.
6. Prices.
7. How to start and the closing call to action, as one section.

Keep the anchors `#plataforma` (scenes) and `#como-funciona` (how to start).

## Section design

### Hero

- Remove `hero-editorial.jpg` from the home.
- The main image is the Golden English site. The second image is the Golden English panel. Both show the full image without a side crop.
- Keep the free page as the primary button. Add a quiet demo button with `home.demoCta` that opens `/contacto?interes=gestion`.
- Add `priority` only to an image that is visible on the current surface.

### Logos

- Keep the count and all client logos. Set one optical height for the logos.
- Move the two client cards to "Your brand".

### Four scenes

- Merge `PulsarHomeStory` and `PulsarHomeBenefits` into one section. Delete `PulsarHomeBenefits`.
- Keep the title `solutions.storyTitle`.
- Read each scene from `home.portals.tabs`: `label`, `headline`, `description`. Do not show `badge`, `bullets`, or `modules`.

| Scene | Image |
|---|---|
| Sunday, 21:40 | `moments/sunday.webp` |
| Tuesday, 16:58 | `moments/class.webp` |
| Day 5 of the month | `marketing/gestion-editorial.jpg`, plus payment logos |
| Friday, 19:15 | `moments/family.webp` |

- Show the Flow logo only in the `cl` market.
- In the `ar`, `uy`, and `py` markets, the Day 5 text must not name Flow. Use an overlay in `src/dictionaries/pulsar/`. Do not name a payment brand there unless the repo already offers it in that market.

### Your brand

- Show the Golden English site and the Golden English panel side by side.
- Remove the "not the same institute" captions. Replace them with short captions in en, es, and pt.
- Put the two client cards under this pair.
- Use the unused `.pairA` and `.pairB` motion when the pair enters the viewport.

### Testimonials

Applies to the home and to `/clientes`, because both use `PulsarVoiceCarousel`.

- Keep all six quotes, names, roles, focus labels, and portraits without change.
- Show all six quotes without a click.
- Remove the arrows. Remove the white boxes. Use hairline dividers.
- Show the portraits at a large size. The source files are 900 x 1200 and now show at 56 px.
- Order: Andrea, Luis, Camila, Rodrigo, Mateo, Sofía. The first two are the people who buy the product.
- Change `clients.voicesTitle` in en, es, and pt, because four of the six voices are not institutions. Spanish: "Lo que cuentan quienes ya lo viven."
- Add portrait motion with the existing `mask` reveal. The quote text does not move.

Layout at `web-desktop`:

```text
+---------+ focus            +---------+ focus
| Andrea  | Large quote      | Luis    | Large quote
| 3:4     | name, role       | 3:4     | name, role
+---------+                  +---------+
---------------------------------------------------
+------+   +------+   +------+   +------+
|Camila|   |Rodri.|   |Mateo |   |Sofía |
+------+   +------+   +------+   +------+
focus      focus      focus      focus
quote      quote      quote      quote
name,role  name,role  name,role  name,role
```

### Prices

- Move the section after the testimonials.
- Remove the three screenshots on the home. `/precios` keeps its images. This changes the home part of `2026-11-07-centrolisto-solution-columns-design.md`.
- Keep the three columns, prices, buttons, and the comparison link.

### How to start and close

- Merge the three steps and the closing message in one section.
- Replace `cta-editorial.jpg` with `presencia-editorial.jpg`. Update its alt text.
- The primary button uses `home.bottomCta.primaryCta` and opens the contact page. The free page is the second button.

## Motion

Keep the easing `cubic-bezier(0.22, 1, 0.36, 1)`. Keep all motion behind `prefers-reduced-motion`.

| Place | Now | New |
|---|---|---|
| Hero text and buttons | Complete at 1620 ms | Complete at or before 700 ms |
| Hero images | Screenshots show before the photo | Main image first, then the panel |
| Reveal distance | 32 to 40 px, three directions | 16 px, up only |
| Scene image | Same image can replay | Opacity cross-fade between stacked images, 400 ms |
| Scene progress | None | Hairline that fills across the four scenes |
| Price hover | Column and image move and scale | Column does not move. Image moves only if one exists. |

Do not add particles, count-up numbers, bounce, autoplay carousels, or a logo marquee. Do not add video to the home in this work.

## Media

All new files go under `public/centrolisto/`. Do not overwrite a source file.

- Make a panel image from `product/admin-hub.jpg`, crop 672 x 467 from x = 288. This removes the Next badge and the cursor dot.
- Make a site image from `clients/golden.jpg`, crop 1440 x 688 from y = 0. This removes the Next badge.
- Trim the white start from `clients/golden.webm` and `clients/espaciozenit.webm`. White frames continue past 22 s in `golden.webm`. `/clientes` can autoplay these files.
- On `/soluciones/gestion`, replace `flow-2-desktop.webm` with the new panel image. The video shows institute finance totals.

## Surfaces (Web vs PWA)

Tier A public marketing. Sections render inside `PulsarSiteChromeEntry`. `PulsarSiteChromePwa` is the narrow chrome.

### Web (`web-desktop`)

- Hero: text on the left and overlapped images on the right.
- Scenes: sticky image on the left and scene text on the right.
- Testimonials: the layout above.
- Prices: three columns.

### PWA and narrow web (`web-mobile` / `pwa-mobile`)

- Hero: show the site image under the text. Do not show a hidden preloaded panel.
- Chrome: hide "Empezar gratis" while the hero button is visible. On a page without the hero button, the bar stays visible. Keep the bottom navigation and safe areas.
- Scenes: one column with each image above its text. No sticky image.
- Testimonials: native horizontal scroll with snap and a part of the next card in view. All six stay in the DOM. No autoplay.
- Prices: one row for each plan with the name and price. The row opens the detail. Targets are 44 px or more. Presencia starts open.
- Client cards: show the full client name. Do not truncate it to "Esp…".
- `/soluciones/gestion`: same image change on both surfaces.

Testimonials and prices have different interactions on each surface, so each uses its own component behind `SurfaceMountGate`. Other sections use one component with breakpoints.

## Analytics

- Keep `cl_create_free_page`, `cl_demo_gestion`, `cl_demo_ecosistema`, and `cl_quote_custom`.
- The new hero and closing demo buttons send a new event from the existing `eventName` property.
- `cl_product_demo` loses its tab buttons. Send it once for each scene when the scene enters the viewport. The plan confirms the tracker API.

## Done when

- The home renders the seven sections in the approved order on both surfaces.
- No screenshot appears in two sections of the home, except the site and panel pair in the hero and in "Your brand".
- `PulsarHomeBenefits` is deleted and has no import.
- Six testimonials render on the home and on `/clientes` with the same quote, name, role, and portrait as today. No arrow buttons render.
- Hero animation delays complete the last element at or before 700 ms.
- `flow-2-desktop.webm` has no reference in `src/`.
- New copy exists in en, es, and pt. Spanish uses neutral tuteo.
- `ar`, `uy`, and `py` do not show Flow in the Day 5 scene.
- A changelog entry describes the visible change.
- Self-contained Vitest tests cover the order, the images, the six testimonials on both surfaces, the market rule, and the chrome bar rule.
- Lint, typecheck, unit tests, and precommit E2E pass.

Target, not a gate: about 7 screens on desktop and about 10 on narrow surfaces.

## Out of scope

- Authenticity of the six testimonials. The user decided to keep them. The note in `2026-11-02-centrolisto-audit-v3-design.md` stays open.
- Copy of the hero title and lead.
- Page-speed work on the 890 KB HTML. This needs its own spec.
- A new high-resolution panel capture. It needs a logged-in session of the user.
- New recordings of `flow-0` to `flow-3`.
- The `/precios`, `/producto`, and segment pages, except the shared price hover.

## Risks

| Risk | Mitigation |
|---|---|
| Other work in the tree changes `PulsarSolutionShowcase`, `PulsarSiteChrome`, the chrome PWA, the dictionaries, and landing tests. | Start after that work is committed, or after the user selects how to combine it. Do not stash. |
| `.cursor/sdd-gate0-approved` points at another spec. | Change the marker only after approval and after that other work ends. |
| The panel crop is 672 px wide, so it is soft at large sizes. | Limit its display width. Replace it when a new capture exists. |
| The Golden English site image shows children. It is already public on the client site and on this home, but the new hero makes it larger. | The user confirms client permission before publication. If there is no permission, use `clients/espaciozenit.jpg` in the hero. |
| `moments/sunday.webp` shows an English calendar on a Spanish page. | Accept for this work. The phone is small in the frame. |
| The `SurfaceMountGate` swap can move content after hydration. | Testimonials and prices are below the first screen. |

## Plan outline

The full plan goes in `docs/superpowers/plans/2026-11-07-centrolisto-landing-reorder.md` after approval.

1. Make the media files.
2. Write failing tests for each section, then implement: motion, hero, logos, scenes, brand, testimonials, prices, close.
3. Add the narrow chrome rule and its test.
4. Add copy in en, es, pt, and the market overlays.
5. Replace the video on `/soluciones/gestion`.
6. Add the changelog entry.
7. Run all checks and compare desktop and narrow captures.
8. Commit the spec, plan, and implementation in one commit.
