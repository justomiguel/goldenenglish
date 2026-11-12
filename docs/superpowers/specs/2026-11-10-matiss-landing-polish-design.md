# Matiss landing — real photos, calmer motion, scene-first copy

Status: draft, waiting for approval.

Builds on `2026-11-09-matiss-studio-tenant-design.md`. The tenant, theme, and routes stay the same.

## Understanding

- The client sent three new photos. Use them on the landing.
- The schedule story (`galeria/4.jpg`) must not appear on the landing. The schedule stays as real text (age finder + table).
- Animations must feel more alive, but calm (rule 44): reveal on scroll, a drawn arc, soft stars. No bounce.
- Copy must tell a scene a parent recognizes. It must not list features.

## New photos

| Source | Content | Target file | Use |
|---|---|---|---|
| Screenshot 00.07.40 | Black and white. Teacher in a Matiss hoodie hugs three girls, seen from behind. Text "MÁS QUE ENSEÑAR acompañar." is part of the image. | `public/images/matiss/fotos/acompanar.jpg` | New manifesto band after the hero. |
| Screenshot 00.07.19 | Small girl in a light blue leotard, backbend, white background. | `public/images/matiss/fotos/pequena.jpg` | Web and PWA hero. Age result for 3–7 years. |
| Screenshot 00.07.29 | Older girl in a black and green leotard, backbend, white background. | `public/images/matiss/fotos/grande.jpg` | Age result for 7–13 years. Gallery. |

Processing: `sharp`, JPG quality 80, max width 1600, EXIF removed. `CREDITS.md` lists them as client photos with consent.

The text inside `acompanar.jpg` is part of the photo. The section heading is the same phrase as a real `<h2>` for screen readers and search. The heading is visually hidden so the phrase is not shown twice. The image `alt` describes the scene only.

`galeria/4.jpg` (schedule story) leaves the gallery and the `certificaciones` slot. The file stays in git, unused, so an old CMS reference does not 404. The gallery becomes: `galeria/1.jpg`, `galeria/2.jpg`, `galeria/3.jpg`, `fotos/grande.jpg`.

## Media slots (`landingMatissCatalog.ts`, `matissLandingImages.ts`)

| Slot | Before | After |
|---|---|---|
| `inicio` | 1: `ilustraciones/og.jpg` | 1: `ilustraciones/og.jpg` (share image, unchanged). 2: `fotos/pequena.jpg` (hero). |
| `modalidades` | none | 1: `fotos/acompanar.jpg` (manifesto band). |
| `niveles` | none | 1: `fotos/pequena.jpg`, 2: `fotos/grande.jpg` (age result). |
| `certificaciones` | `galeria/1..4.jpg` | `galeria/1..3.jpg`, `fotos/grande.jpg`. |

The share image stays the illustration. A child's face does not go into every WhatsApp preview.

Every slot stays CMS-editable through `resolveLandingImageSrcForTheme("matiss", ...)`.

## Motion

All motion uses `cubic-bezier(0.22, 1, 0.36, 1)`. All motion is off under `prefers-reduced-motion: reduce`. Content is visible without JavaScript.

1. **Hero.** Lines of the title rise 12px and fade in, 80ms apart. The photo sits in the organic blob shape. A violet arc draws around it (existing `matiss-arc`). Three small pink stars twinkle slowly (4s opacity cycle, staggered). The photo floats 6px up and down over 7s.
2. **Scroll reveal.** New `MatissReveal` molecule, same pattern as `MozarthitosReveal` (IntersectionObserver, one shot). Sections fade and rise 16px. Class steps and gallery items stagger 70ms.
3. **Manifesto band.** The photo scales from 1.04 to 1 while it enters. A thin pink line draws under the band.
4. **Age finder.** When a parent picks an age, the result card cross-fades with `<ViewTransition>` inside `startTransition`. The matching photo (small girl or older girl) swaps with it.
5. **Buttons.** Hover darkens the token color (rule 26). No opacity hover.

No new dependency. CSS lives in `src/styles/matissLanding.css`.

## Copy (Spanish draft; English and Portuguese follow the same meaning)

| Key | Now | Proposed |
|---|---|---|
| `hero.kicker` | Gimnasia acrobática para niñas | Gimnasia acrobática para niñas de 3 a 13 años |
| `hero.title` | Llega con vergüenza. Sale haciendo la rueda. | Primero se estira. Después, se atreve. |
| `hero.subtitle` | De los 3 a los 13 años, en San Miguel y La Florida. | Sábados en San Miguel y La Florida. Grupos pequeños y una profesora al lado en cada intento. |
| `hero.ctaSecondary` | Ver horarios | Busca su grupo |
| `manifiesto.title` (new) | — | Más que enseñar, acompañar. |
| `manifiesto.body` (new) | — | Una niña no aprende un puente porque se lo expliquen. Lo aprende cuando alguien le sostiene la espalda la primera vez, y la suelta cuando ya puede sola. |
| `manifiesto.alt` (new) | — | La profesora abraza a tres alumnas, sentadas de espaldas en la sala. |
| `sobreNosotros.title` | Un sábado que se espera toda la semana | Valentina abre la sala cada sábado |
| `sobreNosotros.bodyP1` | (features list) | Llegan con el pelo tomado y un poco de nervio. A los diez minutos ya están en el suelo, riéndose, intentando el primer puente. |
| `sobreNosotros.bodyP2` | (values list) | Valentina Tapia Carrasco las mira una por una. Corrige una mano, aplaude un intento, y pide una vez más. Así crecen la disciplina, la diversión y la confianza. |
| `clases.sectionTitle` | Así se vive un sábado | Una hora en la sala |
| `clases.lead` | La clase dura entre una hora y una hora y media. | Entre una hora y una hora y media. Nadie se queda mirando desde la orilla. |
| `edad.sectionTitle` | Elige su edad | ¿Cuántos años tiene? |
| `edad.lead` | Te mostramos el grupo, la hora y la sede. | Elige su edad y te mostramos su grupo, la hora y la sede. |
| `galeria.sectionTitle` | Dentro de la sala | Un sábado cualquiera |
| `cta.title` | El próximo sábado puede ser el primero | El próximo sábado puede ser el primero |
| `cta.subtitle` | Escríbenos la edad de tu hija y te proponemos el grupo. | Trae ropa cómoda y ganas. Nosotras ponemos la colchoneta y te decimos en qué grupo empieza. |
| `edad.photoAltSmall` (new) | — | Una alumna pequeña hace un puente con los pies en la cabeza. |
| `edad.photoAltBig` (new) | — | Una alumna mayor hace un puente con los pies en la cabeza. |

Spanish is neutral tuteo (rule 40). English and Portuguese get the same keys in `en.json` and `pt.json`. Dictionaries are edited by splicing, not by re-serializing the file.

## Surfaces (Web vs PWA)

The screen is Tier A. Matiss uses one section tree inside `LandingSurfaceGate`, like the other bespoke landings.

- **Web (`web-desktop`).** Two-column hero: text left, photo right in the blob with the arc and stars. Manifesto band full width, photo left at 60%, text right. Age finder result shows the photo next to the group card.
- **PWA (`web-mobile` / `pwa-mobile`).** The hero photo goes above the title, portrait crop, inside the safe area. The generated `hero-pwa.jpg` is no longer used on the landing. The manifesto band stacks photo, then text. Age buttons keep ≥ 44px targets. The photo in the age result sits above the card at 160px height. The PWA tab bar does not change.

Shared props: `LandingMatissImages` gains `heroPhoto`, `manifesto`, `ageSmall`, `ageBig`. `LandingMainSectionsMatiss` builds them from the media map. `MatissAgeFinder` gains two image props. No other caller uses these components.

## Plan

1. Process the three photos into `public/images/matiss/fotos/`. Update `CREDITS.md`.
2. Update `matissLandingImages.ts` and `landingMatissCatalog.ts` slots. Remove the schedule story from the gallery.
3. Add `MatissReveal` (molecule) and motion CSS.
4. Add the manifesto band to `LandingMatissSections`. If the file exceeds 250 lines, extract `LandingMatissHero` and `LandingMatissManifesto`.
5. Add photos and `<ViewTransition>` to `MatissAgeFinder`.
6. Splice copy into `en.json`, `es.json`, `pt.json`.
7. Tests (below). Changelog entry. Commit. Deploy `pulsarlab` to production.

## Tests

- `matissLandingImages.test.ts`: the gallery slot does not contain `galeria/4.jpg`. `inicio` 1 stays `og.jpg`.
- `src/variants/owned/matiss/home/v1/Sections.test.tsx`: the manifesto heading exists. No image uses `galeria/4.jpg`. The hero image is `fotos/pequena.jpg`.
- `MatissAgeFinder.test.tsx`: age 5 shows the small photo; age 10 shows the big photo.
- `MatissReveal.test.tsx`: under reduced motion the content is in view at once.
- The existing Spanish copy lock (`neutralSpanishCopy.test.ts`) stays green.

## Risks

- **Faces of children.** The two backbend photos show faces. Consent was confirmed for the first set. The client must confirm it for these too. If not, use only the manifesto photo.
- **Text inside the photo.** The phrase is not translated in English and Portuguese. The visible text stays Spanish. The hidden heading is translated.
- **LCP.** The hero photo becomes the LCP image. It keeps `priority`, explicit size, and stays under 150 KB.
- **CMS overrides.** A tenant upload in a slot replaces the default as before.

## Done when

- The landing shows the three new photos. The schedule story does not appear.
- The motion above works and is off under reduced motion.
- The copy above is live in es, en, and pt.
- Tests pass. The change is committed and deployed to `matiss.centrolisto.cl`.
- Manual QA (user): hero and age finder on a phone and a desktop.

## Out of scope

- Database migrations.
- New sections other than the manifesto band.
- Changes to `/register`, blog, or the share image.
