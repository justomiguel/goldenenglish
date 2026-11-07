# Plan — Mozarthitos family guide

Spec: `docs/superpowers/specs/2026-11-07-mozarthitos-family-guide-design.md`

## Tasks (TDD: red, green, refactor)

1. Pure catalog and resolver: `src/lib/landing/mozarthitos/familyGuideCatalog.ts`, `resolveFamilyGuide.ts`, `guideToken.ts` (parse and build the `guide` token, build the register href).
2. Register pack `mozarthitos`: `schema.ts`, `parseMozarthitosTenantExtras.ts`, `readMozarthitosExtrasFromFormData.ts`, `formatMozarthitosGuideSummary.ts`. Wire `extrasPackForTemplateKind`, `resolveAndStampTenantExtras` (invalid guide: warn and drop), `publicRegistrationInputFromFormData`.
3. `/register`: read `guide`, keep it across intent redirects, pass `guide` to `RegisterSurfaceByTemplate`. `RegisterMozarthitosSurface` shows the summary and puts the hidden `mz_guide` field into `RegisterForm` through a new `formExtras` slot.
4. Admin: `AdminRegistrationMozarthitosGuide` in the desktop row and the PWA card. Export column when the template is `mozarthitos`.
5. Guide UI: hook `useMozarthitosFamilyGuide` (state in the query), desktop and PWA organisms, entry with `SurfaceMountGate`.
6. Route `src/app/[locale]/encuentra-tu-clase/page.tsx` with metadata, `notFound()` for other templates, sitemap entry for the mozarthitos tenant.
7. Landing links: hero secondary CTA and the `#cursos` online CTA.
8. Copy: `landing.mz.guide.*` and `admin.registrations.mozarthitosGuide.*` in en, es, pt. CMS keys in section `niveles`.
9. Changelog entry. Run targeted Vitest, typecheck, lint.

## Stored shape

```json
{ "pack": "mozarthitos", "schemaVersion": 1, "guide": { "stage": "baby_mago", "modality": "in_person", "ageBand": "6m_2y" } }
```
