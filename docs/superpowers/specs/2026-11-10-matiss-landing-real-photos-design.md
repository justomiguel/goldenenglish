# Matiss landing — real photos, competitor-pattern copy, editorial motion

Status: approved by direct order ("ingresa al instagram saca más imágenes… copia lo que hace la competencia… las animaciones siguen siendo muy de amateur").

Builds on `2026-11-10-matiss-landing-polish-design.md`. Tenant, theme kind, routes, and CMS keys stay.

## Understanding

- The AI characters replaced the real photos. The client prefers the real photos. Use only real photos on visible slots.
- The landing shows too few images. Add image surfaces.
- The copy reads weak. Follow the structure of gymnastics school sites (Club Santiago Gym, Acrobacia Libre, The Little Gym, Jungle Gymnastics): free trial first, benefits, programs by age, first class in three steps, social proof, FAQ. Use Matiss facts and the brand voice from its Instagram captions. Do not copy competitor text. Do not invent testimonials or credentials.
- The motion looks amateur (float, twinkling stars). Replace it with editorial motion: masked headline lines, clip-path image reveals, scroll parallax, image hover zoom.

## Photos (`public/images/matiss/fotos/`)

Source: public posts of `@matiss.studio`. The client consented to show the girls. Text overlays were cropped out. `sharp`, JPG q80, EXIF removed.

| File | Content |
|---|---|
| `roja.jpg` | Girl in a silver top and red tutu, sitting, smiling |
| `pequena.jpg`, `grande.jpg` | Same studio shots, now from the 3072px originals |
| `lila.jpg` | Girl in a lilac leotard, backbend |
| `sentada.jpg` | Girl in a light blue leotard, sitting cross-legged |
| `clase-brazos.jpg`, `clase-grupo.jpg`, `clase-profe.jpg` | Real class in the studio room (video frames) |

The AI characters (`personajes/`) and the generated illustrations leave the repo. `ilustraciones/og.jpg` stays as the share image (no child face in every link preview). `galeria/4.jpg` (schedule story) stays off the landing.

## Slots

| Slot | Positions |
|---|---|
| `inicio` (2) | 1 share `og.jpg`, 2 hero `roja` |
| `historia` (2) | 1 manifesto `acompanar`, 2 benefits `pequena` |
| `oferta` (4) | class steps: `clase-brazos`, `clase-grupo`, `clase-profe`, `galeria/2` |
| `modalidades` (2) | 1 contact `galeria/3`, 2 gala `galeria/1` |
| `niveles` (3) | programs Babys `sentada`, Senior `grande`, Babys La Florida `lila` |
| `certificaciones` (8) | gallery mosaic, real photos only |

## Page order

Hero (free trial CTA + three facts line) → manifesto → benefits (`#sobre`) → programs + age finder (`#clases`, `#horarios`) → a class in four photos → first class in three steps → gala → gallery (`#galeria`) → locations (`#sedes`) → FAQ (`#preguntas`) → contact (`#contacto`) → footer.

Group names move from JSX into `landing.matiss.programas.*`.

## Fix

La Florida Babys runs 19:00–20:00 (client schedule story and Instagram). The code said 18:00–19:00.

## Motion

Easing `cubic-bezier(0.22, 1, 0.36, 1)`. All motion inside `prefers-reduced-motion: no-preference`. Content is visible without JavaScript.

1. Hero title lines rise from a mask, 90ms apart. The hero photo opens with a clip-path reveal and settles from scale 1.12.
2. Section images open with a clip-path reveal when the section enters (`MatissReveal`). Text staggers 90ms.
3. Large photos drift with scroll (`animation-timeline: view()`, under `@supports`).
4. Gallery and program photos zoom to 1.05 on hover inside a fixed frame. No opacity hover.
5. Float and twinkle animations are removed.

## Surfaces (Web vs PWA)

Tier A. One section tree inside `LandingSurfaceGate`, as before.

- Web: two-column hero, programs in three columns, gallery mosaic in four columns.
- PWA: hero photo above the title, programs as stacked rows, gallery in two columns, FAQ as full-width `details` rows with ≥ 44px targets, safe-area padding kept.

## Done when

- No `personajes/` or generated illustration renders on the landing, register, or contact page.
- At least 18 image slots render real photos.
- Copy in es, en, pt; Spanish neutral tuteo.
- Tests updated: images, sections, register, age finder, schedule. Vitest, lint, typecheck green.

## Out of scope

Testimonials, prices, a new CMS editor field, push or deploy.
