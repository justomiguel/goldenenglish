# Mozarthitos — family guide "Encuentra tu clase" (design)

Status: approved 2026-11-07
Date: 2026-11-07
Tenant template: `mozarthitos` (`site_theme_kind`)

## Context

Mozarthitos teaches music to babies and children in Las Condes with the Mago Diapasón method.
The landing says only "Desde los 6 meses de vida". The "Modalidad Online" CTA opens `#contacto`. That is a dead end.
Local competitors (Music Together, Kindermusik, Color Splash) publish age bands and formats. None has an age and modality finder.

This guide captures **new families**. It does not match current students to sections.

## Intent

A parent answers two questions: the child's age and whether the family can come to Las Condes.
The page shows one recommended stage and one offer (in person or remote).
The CTA opens `/register` with the answers. The lead reaches Inscripciones tagged with the stage and the modality. Staff assigns the section.

## Decisions

1. **Route.** A page of its own: `/[locale]/encuentra-tu-clase`. Instagram and ads link to it. The hero and the `#cursos` section link to it.
2. **Tenant scope.** The route renders only when the active template is `mozarthitos`. Other tenants get `notFound()`.
3. **Remote offer.** It has two parts: a live online class and a pre-recorded pack.
4. **Stage rules live in code. Offer copy lives in the CMS.** A pure module maps an age band to a stage. Copy uses `dict.landing.mz.guide.*`, registered in `landingMozarthitosCatalog.ts`. Staff can edit it in the CMS without a deploy (rule 46).
5. **Lead tagging.** A new registration extras pack `mozarthitos` writes `tenant_extras.guide`. This follows the Nagô pack pattern. No migration: `tenant_extras` exists (migration 190).

## Stage catalog (approved)

| Stage id | Age band | In person (Las Condes) | Remote |
|---|---|---|---|
| `baby_mago` | 6 months – 2 years, with an adult | 30 min class, Saturday or weekday | Pre-recorded pack + live online class |
| `little_musicians` | 3 – 7 years (score reading) | 30 min class | Live online class (Wednesday) + pack |
| `instrument` | From 5 years — violin or cello | 30 min, groups of 2 to 5 | Not offered yet: show "contact us" |
| `adult_choir` | 18+ | 60 min, evening | Not offered |

Age input options: `under_6m`, `6m_2y`, `3y_4y`, `5y_7y`, `8y_plus`, `adult`.

- `under_6m` shows a "from 6 months" message and a waitlist CTA (`/register?intent=reserve`).
- `5y_7y` shows `little_musicians` first and `instrument` as a second option.
- `8y_plus` shows `instrument`.
- `adult` shows `adult_choir`. A secondary link on every result offers the choir to parents.

Modality input: `in_person`, `remote`, `unsure`. `unsure` shows the in-person offer first and the remote offer below it.

## Flow

1. Step 1 — age (one choice).
2. Step 2 — modality (one choice).
3. Result. The result shows:
   - the stage name and what the child does;
   - what the adult does;
   - the session length and the place (map link for in person);
   - the primary CTA.
4. CTA targets:
   - in person or live online: `/register?intent=trial&guide=<stage>.<modality>.<age>`;
   - pack: `/register?intent=trial&guide=<stage>.pack.<age>`.
5. `/register` parses `guide` with a strict allow-list. An unknown value is dropped. The form shows a small summary ("Elegiste: Baby Mago · Presencial") and keeps it in a hidden field.
6. The server action validates the field again (Zod) and stores `tenant_extras.guide = { v: 1, stage, modality, ageBand }` only when the template is `mozarthitos`.

The step state lives in the query (`?edad=&modalidad=`). Back, forward, and shared links keep the answers (rule 42 spirit; no `sessionStorage` needed because the URL is the state).

## Surfaces (Web vs PWA)

Tier A: public journey for parents. Two trees through `useAppSurface()` / `SurfaceMountGate`.

- **Web (`web-desktop`).** Uses `MozarthitosSiteHeader`. The two questions sit side by side as large choice cards. The result shows on the same page in two columns: the offer on the left, the CTA and the place on the right.
- **PWA (`web-mobile` / `pwa-mobile`).** One question per screen. Full-width list rows, each at least 44 px high. A bottom primary CTA in the thumb zone, and safe-area padding. The result is a vertical list with a sticky bottom CTA. `PublicPwaTabBar` stays visible.
- **Shared.** The hook `useMozarthitosFamilyGuide` (state from the query, result from the pure resolver) and the pure module `src/lib/landing/mozarthitos/resolveFamilyGuide.ts`.
- **Register.** `RegisterMozarthitosSurface` (Web and PWA) gets an optional `guideSummary` prop. Other surfaces do not change.

## Layers

| Layer | Change |
|---|---|
| Pure | `src/lib/landing/mozarthitos/familyGuideCatalog.ts` (ids, age bands), `resolveFamilyGuide.ts`, `parseGuideParam.ts` |
| Register pack | `src/lib/register/packs/mozarthitos/` (`schema.ts`, `parseMozarthitosTenantExtras.ts`, `readMozarthitosExtrasFromFormData.ts`). `extrasPackForTemplateKind` returns `"mozarthitos"`. |
| Route | `src/app/[locale]/encuentra-tu-clase/page.tsx` (+ `generateMetadata`) |
| Hook | `src/hooks/useMozarthitosFamilyGuide.ts` |
| UI | `src/components/desktop/organisms/MozarthitosFamilyGuideDesktop.tsx`, `src/components/pwa/organisms/MozarthitosFamilyGuidePwa.tsx`, entry `MozarthitosFamilyGuideEntry.tsx`, molecules for the choice card and the result |
| Landing | Hero secondary CTA and the `#cursos` online CTA link to the guide |
| Admin | `AdminRegistrationMozarthitosExtras.tsx` in `AdminRegistrationExpandedDetails` and the PWA card. The CSV export gets a "Guía" column. |
| Copy | `landing.mz.guide.*` and `admin.registrations.mozarthitosGuide.*` in `en.json`, `es.json`, `pt.json` (neutral tuteo). Keys registered in the CMS catalog. |
| SEO | Indexable. Title `Encuentra tu clase \| Mozarthitos`, description, canonical, hreflang, OG image, sitemap entry only for the mozarthitos tenant |
| Changelog | Entry `mozarthitos-family-guide` in `src/lib/product-changelog/catalog.ts` |

## Analytics and observability

`POST /api/analytics/events` needs a session (it returns 401 for anonymous visitors). A new family has no session.

- The persisted funnel outcome is the registration row: `intent` plus `tenant_extras.guide`. Staff can count leads per stage and modality.
- The register action logs rejects of a bad `guide` value with `logServerWarn` (`scope: register.mozarthitosGuide`, `reason: invalid_guide`).
- Step-level tracking for anonymous visitors is out of scope. It needs a new anonymous ingest and an ADR.

## Governance

The public `/register` contract gets one optional query param and one optional form field. Auth, RLS, and schema do not change. A "Decisions" section in the commit is enough; no new ADR.

## Tests (Vitest, self-contained)

- `resolveFamilyGuide.test.ts`: every age × modality pair, `under_6m` waitlist, `5y_7y` second option, `unsure` order.
- `parseGuideParam.test.ts`: valid values, unknown values, injection strings.
- `mozarthitos` pack: schema, form-data read, stamp only on the mozarthitos template.
- `registerActions.test.ts`: guide stored for mozarthitos; ignored for another template.
- Desktop and PWA guide components: steps, result, CTA href (mocked dict).
- `RegisterMozarthitosSurface.test.tsx`: summary shows with `guideSummary`.
- Admin extras component renders stage and modality labels.
- Route: `notFound()` for a non-mozarthitos template.

## Manual QA (user)

- Walk every age option on desktop and on an installed PWA.
- Open a shared link with `?edad=&modalidad=` and check the result.
- Submit a trial registration from the guide. Check the tag in Inscripciones (desktop and PWA card) and the CSV column.
- Edit one `mz.guide.*` string in the CMS and check the page.
- Lighthouse mobile on `/es/encuentra-tu-clase`.

## Done when

- The guide route works on Web and PWA for the mozarthitos tenant and 404s elsewhere.
- Every result has a working CTA. The online CTA no longer goes to `#contacto`.
- The registration stores `tenant_extras.guide`, and staff see it in Inscripciones and in the export.
- Copy is in three locales and editable in the CMS.
- The tests above pass. The changelog entry exists.

## Resolved questions (2026-11-07)

1. Violin and cello start at 5 years. Confirmed.
2. The remote instrument offer shows "contact us" for now. Confirmed.
3. The pre-recorded pack exists today. The pack CTA opens `/register?intent=trial`.
4. Adult choir shows as a secondary link for parents on every result (spec default; easy to remove).

## Out of scope

- Fixes to section data (ops, staff-owned):
  - the ONLINE sections are stored as `in_person`;
  - "MARTES 16:30" has slot 15:30;
  - "VIERNES 15:30" starts 15:03;
  - "Test Flow" is active in the 2026 cohort.
- Automatic section assignment from the guide.
- Prices on the page.
- Anonymous step analytics.
- The guide for other tenants.
