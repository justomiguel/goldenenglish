# Matiss Studio — tenant and exclusive theme `matiss`

Status: draft, waiting for approval.

## Intake form (`docs/runbooks/exclusive-landing-request.md`)

| Field | Value |
|---|---|
| Client | Matiss Studio |
| Tenant slug | `matiss` |
| Theme slug (`SiteThemeKind`) | `matiss` |
| Readable name | ES "Matiss Studio" · EN "Matiss Studio" · PT "Matiss Studio" |
| Exclusive | Yes. Owner list: `["matiss"]` |
| Domain | CentroListo subdomain `matiss.<centrolisto apex>` (resolved by `src/lib/tenant/pulsarSubdomain.ts`). No custom domain now. |
| Supabase | Shared. `data_mode = shared_schema`, schema `tenant_matiss`, CentroListo database. |
| Vercel | No new project. The CentroListo deployment serves the subdomain. |
| Palette | From the logo: lavender, violet ink, pink, cream (values below). |
| Fonts | Soft serif display for the lowercase wordmark feel, rounded sans for body (both `next/font/google`). |
| Logo | Round badge: violet ballerina in arabesque, pink crescent, stars, serif "matiss", pink "STUDIO". |
| Photos | Teacher with three girls; group with heart hands; backbend with teacher; schedule story (gymnast with ball). |
| Sections | Hero, a class from the inside, groups by age + schedule, two locations, the director, values, gallery, CTA + contact, footer. |
| `/register` surface | `RegisterMatissSurface` (rule 28). |
| Web and PWA | Both. Details in **Surfaces**. |
| Approver | Justo Vargas. |

### Business facts

- Acrobatic gymnastics for girls, 3 to 13 years.
- Locations: San Miguel and La Florida (Santiago, Chile).
- Values: Disciplina · Diversión · Confianza.
- Director: Valentina Tapia Carrasco (Instagram `@velenn.tinaa`). Studio Instagram: `https://www.instagram.com/matiss.studio/`.
- Contact: phone and WhatsApp `+56 9 8747 6023`, email `valentinatapiacarrasco@gmail.com`.
- Photo consent: confirmed by the client.
- Schedule:
  - San Miguel, Saturday: Curso Babys, 3–6 años, 12:30–13:30.
  - San Miguel, Saturday: Curso Senior, 7–13 años, 13:30–15:00.
  - La Florida, Saturday: Curso Babys, 4–7 años, 18:00–19:00. The client confirmed this time. The story showed an older 19:00–20:00.
- Trial class: yes. The main button says "Agenda una clase de prueba".
- Addresses: not yet. Show only the comuna. The address is a CMS-editable theme property.

## Understanding

- Create the institute `matiss` as a shared-schema site on CentroListo, the same way staff create a site in `/admin/tenants/new`.
- Give it a bespoke landing that only `matiss` can select. Espacio Zenit and Liora are the reference, not the template.
- The audience is parents of girls 3–13. They must find the group for their daughter's age, the time, the place, and the enrollment button fast.
- "Demos de alta todo" means the code, the theme, the assets, and the tenant row.

## Research (what good kids' gymnastics sites do)

Sources: TaDa Gymnastics (PRYDE), Tumbles Fairfax and emPOWER kids (Topmark), ATA Gymnastics (Zarla), Maldon Gymnastics (Plesner), Carito Gym and Acrobacia Libre (Chile).

1. Ages and the address are on the first screen.
2. A class finder by age, not a wall of text.
3. Real action photos of children with a coach, so a parent can picture the room.
4. Trust for the parent: who teaches, how a class runs, safety.
5. One clear button to try or to enroll, on every screen.
6. Soft organic shapes and pastel colors read as "for kids" and still look organized.
7. Calm scroll reveals. Nothing flashy.

What Matiss takes from each reference:

| Reference | Idea | Where it goes in Matiss |
|---|---|---|
| ATA Gymnastics | Name the specialty in the headline. Photo cropped in an organic shape. | Hero says "gimnasia acrobática". Photo in the crescent mask. |
| Tumbles Fairfax | Wavy dividers, pastel colors, still organized. | Soft wave dividers between lavender and blush bands. |
| TaDa Gymnastics | A schedule a parent can scan. A page per location. | "Find her group" by age. Two location blocks. |
| emPOWER kids | Many real photos. Values inside the copy. | Gallery and director photo. Values written as one sentence. |
| Zarla roundup | Ages and place on the first screen. A trial as the main button. | "3 a 13 años · San Miguel y La Florida" in the hero. "Agenda una clase de prueba". |
| Maldon Gymnastics | Path to the trial from every screen. Calm motion. | Enroll button in header, hero, and the PWA bottom bar. Slow reveals. |
| Carito Gym, Acrobacia Libre (Chile) | Local tone. Simple facts: days, times, ages. | Saturday schedule in plain words. Spanish tuteo. |

## Design direction

Rule 44 applies. No chip rows, one kicker at most, no 3-stat hero, no icon-card grids, no red/green boxes.

### Palette (sampled from the logo file, AA checked)

Colors measured from the logo pixels:

- Ballerina and wordmark violet: `#9A78C6`.
- Crescent and "STUDIO" pink: `#F0BEE6`.
- Badge background: blush white `#FCF0F0` and lavender `#F0E4F0`.

The logo violet gives 3.57:1 on white. That fails AA for text. Text and buttons use darker shades of the same hue. The logo colors stay for shapes, the crescent, and large decoration.

| Token | Value | Source | Contrast | Use |
|---|---|---|---|---|
| `color.background` | `#FCF4F7` | Badge blush | — | Page paper |
| `color.surface` | `#FFFFFF` | — | — | Panels |
| `color.foreground` | `#3A2A52` | Violet, darkest | 11.9:1 on bg | Body text |
| `color.primary` | `#6B4C9E` | Logo violet, darker | 6.2:1 on bg | Buttons, links |
| `color.primary.foreground` | `#FFFFFF` | — | 6.7:1 | |
| `color.secondary` | `#A6458E` | Logo pink, deeper | 5.0:1 on bg | Second button, highlights |
| `color.secondary.foreground` | `#FFFFFF` | — | 5.4:1 | |
| `color.accent` | `#F0BEE6` | Logo pink, exact | decorative | Crescent, shapes. Never small text |
| `color.accent.foreground` | `#3A2A52` | — | AA | |
| `color.muted` | `#F0E4F0` | Badge lavender, exact | — | Section bands |
| `color.muted.foreground` | `#665A78` | — | 5.9:1 on bg | Secondary text |
| `color.border` | `#D8C0E4` | Logo lavender | — | Hairlines |
| CSS `--matiss-violet` | `#9A78C6` | Logo violet, exact | decorative | Arabesque line, stars, large display type ≥ 24 px only |

A test locks every text pair at ≥ 4.5:1.

### Signature moves

1. **Crescent hero.** The hero photo sits inside a crescent-moon mask taken from the logo. A thin SVG line draws an arabesque arc on first paint (`cubic-bezier(0.22, 1, 0.36, 1)`, off under `prefers-reduced-motion`). The first screen shows: headline, "3 a 13 años · San Miguel y La Florida", the enroll button, and "Ver horarios".
2. **Scene-first copy.** Example headline (es): "Llega con vergüenza. Sale haciendo la rueda." Subline names the ages and the places.
3. **A class from the inside.** One horizontal line with four moments: llegada y calentamiento, acrobacias guiadas, juego, cierre con aplauso. It is a timeline, not cards.
4. **Find her group.** An age control (3 to 13). Picking an age shows the matching group, its time, and its place. Example: age 5 shows Babys San Miguel 12:30 and Babys La Florida 19:00. Logic lives in a pure module `src/lib/landing/matissSchedule.ts`.
5. **Two locations.** San Miguel and La Florida side by side, each with its own groups. Address and map link come from the theme properties.
6. **The director.** Photo of the teacher with three girls, a short first-person quote, and a link to `@velenn.tinaa`.
7. **Values as one sentence.** "Disciplina para intentarlo otra vez, diversión para querer volver, confianza para mostrarlo." No three boxes.
8. **Gallery.** Same lightbox pattern as Liora (`LioraLandingGallery`), with Matiss assets.
9. **CTA + contact.** Enroll button (follows `publicCtaMode` / `inscriptionsEnabled`), Instagram, WhatsApp when set.

### Generated illustrations

The client photos are few and low resolution. Generated illustrations fill the gaps.

Rules:

1. Generate only illustrations in the logo style: flat violet silhouettes, the pink crescent, sparkle stars, blush and lavender paper.
2. Do not generate realistic photos of children. Do not draw faces. A fake photo of a girl would show a student who does not exist.
3. Real moments use the client photos only (teacher with girls, heart hands, backbend).
4. Generate once, during this change. Store the files in git. Do not call an image model during a request.
5. Compress to WebP or JPG. Write each file in `public/images/matiss/CREDITS.md` and mark it as AI-generated.
6. Alt text comes from `en.json`, `es.json`, and `pt.json`.

Set (folder `public/images/matiss/ilustraciones/`):

| File | Ratio | Use |
|---|---|---|
| `hero-web.jpg` | 16:9 | Web hero background. Three silhouettes (cartwheel, bridge, arabesque), crescent, stars. Left side empty for text. Sample approved in chat. |
| `hero-pwa.jpg` | 9:16 | PWA hero. Same scene, stacked. Bottom third empty for text. |
| `clase-1.png` … `clase-4.png` | 1:1 | "A class from the inside": warm-up, guided acrobatics, game with a ball, applause at the end. |
| `edad-pequenas.png`, `edad-grandes.png` | 1:1 | Age control: a small silhouette (3–6) and a taller one (7–13). |
| `og.jpg` | 1200×630 | Share image: logo badge, illustration, "Matiss Studio". Host name for rule 47. |

Decorative waves and the crescent mask are inline SVG in code, not images.

## Surfaces (Web vs PWA)

The landing is public and converts families, so Tier A applies. Bespoke landings in this repo render their sections inside `LandingSurfaceGate`. The gate already picks the desktop shell or the PWA shell with `useAppSurface()`.

- **Web (`web-desktop`)**
  - `MatissSiteHeader` with logo, anchors (Clases, Horarios, Sedes, Galería, Contacto), and the enroll button.
  - Hero split: copy left, crescent photo right.
  - Class timeline horizontal. Age control as a slider-style segmented row. Locations in two columns.
- **PWA (`web-mobile` / `pwa-mobile`)**
  - Compact header with logo only. Navigation goes through `PublicPwaTabBar` (add the `matiss` entries).
  - Hero stacked: crescent photo on top, copy below.
  - Class timeline vertical. Age control as a horizontal scroller of 44 px targets with snap.
  - Locations as full-width list rows with a "Cómo llegar" row action.
  - A bottom thumb-zone enroll button above the tab bar, with `env(safe-area-inset-bottom)`.
- Shared props and hooks stay the same as Liora's. No change to `LandingSurfaceGate`, `useAppSurface`, or other themes' PWA trees.
- Tests to keep green: `tierADashboard*`, `PublicPwaTabBar*`, existing `*Liora*` and `*EspacioZenit*` tests.

## Proposed plan (affected layers)

1. **ADR** `docs/adr/2026-11-matiss-exclusive-theme.md`. It records the provisioning-time seed decision below.
2. **Migration** `supabase/migrations/268_site_theme_kind_matiss.sql`: `ALTER TYPE public.site_theme_kind ADD VALUE IF NOT EXISTS 'matiss'`. Update `masterdb.sql`. Apply with `npm run sql:apply-migration:all-tenants:pg`.
3. **Types and owner**: add `matiss` to `SITE_THEME_KINDS`, owner row `matiss: ["matiss"]`. Not in `GENERIC_INSTITUTE_KINDS` or the CentroListo catalog.
4. **Theme seed at provisioning (root fix).**
   - Problem: the staff shared-schema create path prepares `tenant_<slug>` but does not create or activate the brand theme row. A seed migration would put a Matiss row into every institute, and brand-data files are skipped on shared schemas anyway.
   - Fix: `src/lib/theme/exclusiveThemeSeeds.ts` (pure) holds the default properties per exclusive kind. A server helper `seedExclusiveSiteTheme` inserts the row with `ON CONFLICT (slug) DO NOTHING` into that schema and activates it. The staff create action calls it when `brandThemeSlug` is an exclusive kind and `canTenantUseThemeKind(kind, slug)` is true.
   - Failure returns a stable code (`exclusive_theme_seed_failed`) with its own sentence (rule 50), logged with `[ge:server]` scope `pulsar.seedExclusiveSiteTheme`.
   - Add `matiss` to `BRAND_DATA_FILE` in `planInstituteMigrationApplies.ts` so a future Matiss brand file stays off other targets.
5. **Landing**: `LandingMainSectionsMatiss`, `LandingMatissSections`, section components, `MatissSiteHeader`, `LandingMatissFooter`, `MatissFontRoot`, `src/styles/matissLanding.css`, wiring in `loadLandingMainSections`, `marketingLandingKinds`, `MARKETING_FOOTER_BRAND`, `sharePreviewBundleKey`, `resolveSharePreviewLogoUrl`, `publicExperienceNav`, `PublicTenantChrome`.
6. **Other public surfaces** (same parity as Liora): contact, blog shell, privacy, answer pages use Matiss chrome.
7. **`/register`**: `RegisterMatissSurface` + `MatissRegisterHeader` in `RegisterSurfaceByTemplate`.
8. **CMS**: `landingMatissCatalog.ts`, entries in `landingThemeEditorCatalog`, `landingContentCatalog`, `resolveLandingMedia`, `buildLandingEditorViewModel`, preview mock.
9. **Assets** under `public/images/matiss/`: `logo/logo.png` (cropped badge), `inicio/1.jpg`, `historia/1.jpg`, `galeria/1..n.jpg`, the generated `ilustraciones/*` set, `CREDITS.md`. Images resized and compressed.
10. **Copy**: `en.json`, `es.json`, `pt.json` under the marketing landing namespace. Spanish tuteo.
11. **Tests** (self-contained):
    - `matissSchedule` age matching (3, 5, 7, 13, out of range).
    - Owner guard: `matiss` allowed for `matiss`, `kind_not_available` for another tenant, absent from the CentroListo catalog.
    - `exclusiveThemeSeeds` contrast pairs pass AA.
    - Staff create action calls the seed for an exclusive kind and not for a generic kind. Seed failure returns its code.
    - Landing sections render key headings and the age control. Register surface renders.
12. **Changelog** entry (staff-visible: new exclusive template provisioning) in `catalogEntriesHead.ts`.
13. **Tenant row**: after deploy, staff creates `matiss` in `/admin/tenants/new` with shared schema and theme `matiss`. The seed runs in that action. I do not write the row with a service-role script (rule 12).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Photos show minors on a public site. | Confirm consent with the client before publishing. Gallery stays editable in the CMS. |
| Screenshot photos are low resolution. | Use them where they display small. Ask for originals for the hero. |
| Exact days of the week and addresses are missing. | Show only what we know. Keep days and addresses as CMS-editable properties. |
| Seed at provisioning changes a shared create action. | Only runs for exclusive kinds owned by that slug. Tests lock the generic path. |
| Enum migration runs on every institute. | `ADD VALUE IF NOT EXISTS` is additive and safe. |
| Bundle size from new fonts. | Two families, subset `latin`, `display: swap`. |

## Definition of done

- `matiss` is a `SiteThemeKind` owned only by `matiss`, absent from generic catalogs.
- Staff create of a shared-schema `matiss` site seeds and activates the Matiss theme in `tenant_matiss`.
- Landing, header, footer, contact, blog, privacy, answer pages, and `/register` render the Matiss design on Web and PWA.
- Copy in en/es/pt. Spanish tuteo. No hardcoded brand outside the theme row.
- Rule 47: logo on first paint, title with the host once, canonical, hreflang, OG image, JSON-LD.
- Vitest for the listed tests green. Typecheck and lint clean on touched files. Files under 250 lines.
- Migration 268 applied through the all-tenants command.
- Changelog entry added.
- **Manual QA (user):** open `matiss.<apex>` on desktop and phone, check the hero, age control, register, and the CMS picker on another tenant.

## Out of scope

- Custom domain (for example `matiss.cl`) and a dedicated Vercel project.
- Online payments and pricing tables.
- Rewriting Espacio Zenit or Liora.

## Open questions

1. Originals of the photos at higher resolution, if available.

Answered: contact (phone, WhatsApp, email), photo consent, director name, schedule (all Saturday), trial class (yes), addresses (later, CMS-editable).
