# CentroListo template skins — one content model, many layouts

Status: draft (Gate 0). Waiting for user approval.

## Scope

Only the CentroListo free-site templates (`GENERIC_INSTITUTE_KINDS`):
`deportes`, `jardin`, `colegio`, `musica`, `idiomas`, `deportes2`, `jardin2`, `colegio2`, `idiomas2`, `musica2`.

Out of scope: institute templates (`classic`, `editorial`, `minimal`, `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`).

## Understanding

- A template is a **skin**. Every skin shows the same sections and the same information. A skin changes only layout and motion.
- The owner or CentroListo staff can change the skin at any time.
- On a skin change, owner text and owner photos stay. Default text and default photos change to the new skin defaults.
- List content (offer items, team, schedule, FAQ, admission steps) becomes editable by the owner.

## Audit (current state, 2026-11-06)

1. **Two families.**
   - `deportes`…`idiomas` share `LandingMainSectionsGeneric`. Only `genericLandingComposition.ts` changes (hero, day, bands, close layouts). Sections: hero, day rhythm (3 lines), historia, oferta, modalidades, niveles, certificaciones, close, contact. One paragraph per section.
   - `*2` kinds each have a bespoke organism under `src/components/organisms/<x>-dos/` (about 2,400 lines in total). They add kind-only blocks: manifesto, disciplines/stages/languages/instruments, pillars, coaches/teachers, schedule or agenda with filters, FAQ, admission steps, quiz (`idiomas2`), audio lab (`musica2`).
2. **Copy keys contain the kind.** Overrides use `genericLandings.<kind>.*` (`genericLandingCopyKeys.ts`). A different kind reads different keys. Owner text is lost.
3. **Each kind is a separate `site_themes` row** (`generic-<kind>`). `site_theme_media` is keyed by `theme_id`. `activateFreeSiteTheme` switches `is_active` to another row. A switch therefore loses text, photos, and color overrides.
4. **Lists are not editable.** `*2` arrays live only in `src/dictionaries/*.json`. The CMS accepts scalar strings only (`landingContentCatalog.ts`).
5. **Uneven information.** The first family has no team, schedule, FAQ, or admission. Each `*2` kind has a different block set.
6. **Who can switch.** The owner picks a kind only at creation (`createOwnerFreeSite`). After that, only staff can change it (`PulsarAdminTemplateSelect`).
7. **Motion.** CSS modules only, 0–2 keyframes per kind. No motion library.
8. **Surfaces.** No PWA or mobile tree. All landings are responsive JSX.
9. **Media fallback.** `genericSectionPhotos` / `genericSectionStockPath` already fall back to the active kind's stock file when no upload exists. That behavior is correct and stays.

## Decisions (confirmed by the user)

- **Section set:** the rich set (below). The first family gains sections.
- **Lists:** editable in this change.
- **Who can switch:** the site owner, for their own site only, and CentroListo staff (`platform_staff`). Another owner cannot. Finer staff roles are a later change.

## Canonical content model (skin contract v1)

Every skin renders every section in this order. A section with no items is hidden. Limits are maximums.

| Section id | Fields | Lists | Photo slot |
|---|---|---|---|
| `inicio` | label, scene, title, body, cta, heroCta, imageAlt | — | `inicio::1` |
| `ritmo` | — | rhythm lines (≤6) | — |
| `historia` | label, body | manifesto lines (≤6) | `historia::1` |
| `oferta` | label, body | items `{id, name, line, detail}` (≤12) | `oferta::1` |
| `metodo` | label, body | pillars `{title, line}` (≤6) | `modalidades::1` |
| `horarios` | label, body | levels `{id, label}` (≤6), slots `{itemId, levelId, when, place}` (≤40) | `niveles::1` |
| `equipo` | label | people `{name, role, line}` (≤12) | — |
| `comunidad` | label, body, title, closingBody | — | `certificaciones::1` |
| `admision` | label | steps `{title, line}` (≤6) | — |
| `faq` | label | entries `{q, a}` (≤12) | — |
| `contacto` | label, laterTitle, laterBody | — | — |

`label` is the section name in the menu and the section heading. `ritmo` and `historia` manifesto lines are lists of `{text}`.

- All text is localized (`es`, `en`, `pt`).
- Photo slots keep the current `section::position` keys, so `site_theme_media` needs no change.
- The `idiomas2` level quiz and the `musica2` audio lab are removed (user decision). Their components, CSS, and dictionary keys go away.
- Other kind-only decoration (for example `idiomas2` greetings) carries no institute data. It reads skin default copy from the dictionaries and is not part of the contract.

## Resolution rule

For each field and list: **owner value if set, else the active skin default.**

- Owner values are stored once, without a kind in the key.
- Skin defaults stay in `src/dictionaries/*.json` under `landing.genericLandings.<kind>`, reshaped to the canonical model for all 10 kinds.
- A list is replaced as a whole. If the owner saved a list, the skin default list is not merged into it.
- Photos follow the same rule (already true).
- Colors follow the same rule. Owner color overrides stay. If the owner did not set colors, the new skin palette applies.

## Persistence

1. New migration `supabase/migrations/2xx_site_themes_skin_content.sql`:
   - `ALTER TABLE public.site_themes ADD COLUMN IF NOT EXISTS skin_content JSONB NOT NULL DEFAULT '{}'::jsonb;`
   - Shape: `{ "v": 1, "sections": { "<sectionId>": { "fields": {...}, "lists": {...} } } }`.
   - No SQL backfill. Existing owner text stays in `content` under `genericLandings.<kind>.*` and `genericSectionLabels.*`. A pure mapper (`legacyGenericContentToSkin`) reads those keys for any kind prefix. The resolver merges them under `skin_content` (stored value wins). The first save of a section writes the merged section to `skin_content`. Old keys stay (additive, rule 21).
   - Reason: a read-time mapper is testable in Vitest and has no data risk. A SQL backfill across all tenant schemas does not add value over it.
   - RLS: no new policy. Reads and writes go through the existing server boundary.
   - Apply with `npm run sql:apply-migration:all-tenants:pg` (rule 45). Update `masterdb.sql`.
2. **Skin change on the same row.** The active row keeps its id, `content`, `skin_content`, `properties`, and media. Only `template_kind` changes. `platform_tenants.brand_theme_slug` does **not** change: `loadActiveTheme` and `loadPulsarThemeEditor` find the row by that slug. Do not activate another `generic-*` row.
   - Colors: if the row color properties still equal the old skin palette (`genericKindColorOverrides`), they are replaced by the new skin palette. Otherwise the owner chose them, and they stay.
   - For free sites, the staff `PulsarAdminTemplateSelect` stops editing `brandThemeSlug`. It links to the skin picker instead.
3. Pure module `src/lib/landing/skin/`: Zod schema, `parseSkinContent`, `resolveSkinContent(kind, skinContent, dict, locale)`. No Supabase, no React.

Option considered: store lists inside the existing `content` JSONB. Rejected. `content` is typed as `section → key → LocalizedCopy` and is cleaned by `cleanLandingContentForPersistence` for institute templates too. Lists would break that contract.

## Server boundary and authorization

- New server actions in `src/app/[locale]/cuenta/` (owner) and the Pulsar admin tenant theme route (staff). Both call the same `src/lib/pulsar/` adapters:
  - `changeSiteSkin({ slug, kind })`.
  - `saveSiteSkinContent({ slug, section, patch })`.
- Authorization: `resolvePulsarSiteActor(slug)`. Allow `staff`, and `owner` of that slug only. All other actors get `forbidden` and `logServerAuthzDenied`.
- Validate `kind` with `isGenericInstituteKind` and the payload with Zod.
- Audit: `platform_audit_log` rows `tenant.skin_change` (`from`, `to`) and `tenant.skin_content_save` (section id only, no text).
- Analytics: owner `action` events per rule 08.
- Logs: `[ge:server]` helpers on every failure (rule 25).
- Refresh: `revalidatePath` for the public site and the editor, plus `router.refresh()` in the hooks (rule 27).
- ADR: `docs/adr/2026-11-centrolisto-template-skins.md` (new data contract, owner write path).

## UI

### Skin renderer

- `LandingMainSectionsGeneric` becomes the single entry for all 10 kinds. It receives the resolved canonical model.
- Each kind is a **skin definition**: per-section layout variant, CSS module, and motion preset. The `*2` organisms are split into per-section skin components that read the canonical model.
- Each section has a closed set of layout variants (for example `oferta`: `rail`, `grid`, `ruled`, `catalog`). Skins pick variants. No booleans per kind (composition patterns).
- Motion: CSS only, `cubic-bezier(0.22, 1, 0.36, 1)`, gated by `prefers-reduced-motion` (rule 44).
- Files stay under 250 lines (rule 03).

### Skin picker

- Owner: new screen under `/cuenta` for that site. Staff: replaces `PulsarAdminTemplateSelect` usage on the tenant theme page.
- Gallery of the 10 skins with `genericPreviewSrc` thumbnails.
- **Live preview with the owner's content.** Selecting a skin opens a preview of the site in that skin with the owner's text, photos, and colors. The preview reads the same resolved model and writes nothing. The owner confirms from the preview.
- `ConfirmActionModal` lists what changes (layout, motion, default photos and default text) and what stays (owner text, owner photos, owner colors).
- Icons on buttons (rule 16). Copy in `en.json`, `es.json`, `pt.json` (neutral tuteo).

### Content editor

- Extends the current generic site copy editor (`buildGenericSiteCopyFields` callers) to the canonical sections.
- List editor for each list: add, edit, reorder, remove, with the limits above.
- Photo uploads keep `InlineUploadProgressBar` (rule 48). The owner can replace every photo slot.
- **Colors.** The owner can pick primary, accent, and paper colors at any time (same fields as creation: `parseTemplatePalette` / `templatePaletteOverrides`). A reset returns to the active skin palette. Contrast is checked before save (rule 26).

## Surfaces (Web vs PWA)

- These landings are a public journey for families. Rule 05 puts them in Tier A.
- Today they have no PWA tree. This change adds **one shared mobile tree for all skins** (user decision). The skin colors and the owner photos apply on mobile too:
  - **Web (`web-desktop`):** per-skin layouts as described above.
  - **Mobile (`web-mobile` / `pwa-mobile`):** one touch-first shell with skin tokens. Full-width list rows, ≥44px targets, safe areas, bottom contact CTA, filters for schedules as sheets. Lighter motion per skin.
  - Selection through `useAppSurface()` / `SurfaceMountGate`.
- The skin picker and the editor are owner and staff tools (Tier B). Desktop is enough. They must still work on narrow screens.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Legacy mapping maps a key wrong and owner text disappears | Old keys stay. Mapper tests per kind. Read falls back to old keys while `skin_content` lacks a field. |
| Rewriting the `*2` organisms breaks their look | Visual parity checklist per skin (manual QA by the user). Split work into one plan task per skin. |
| A skin cannot show a list well (for example a 40-slot schedule in a minimal layout) | Each section variant defines overflow behavior (show N, then "see all"). |
| An owner edits a site they do not own | `resolvePulsarSiteActor` check in every action. Tests for `forbidden`. |
| `brand_theme_slug` mismatch after a switch | Plan step verifies every reader of `brand_theme_slug` before the change. |
| Large scope | Plan phases: model + migration, renderer + skins, picker, editor, mobile tree. |

## Definition of done

- [ ] All 10 skins render the 11 canonical sections from one resolved model.
- [ ] A skin change keeps owner text, owner photos, and owner colors. Defaults follow the new skin.
- [ ] Owner can switch only their own site. Staff can switch any site. Others get `forbidden`.
- [ ] Lists are editable with limits and validation.
- [ ] Owner can change colors and every photo slot at any time.
- [ ] Skin picker shows a live preview with the owner's content before the confirm.
- [ ] `idiomas2` quiz and `musica2` audio lab removed (code, CSS, dictionary keys).
- [ ] Migration applied to all tenants. Legacy owner text is visible through the mapper. `masterdb.sql` updated.
- [ ] ADR written and linked.
- [ ] Audit, analytics, and logs in place.
- [ ] Mobile tree for the landing behind `useAppSurface()`.
- [ ] Vitest: schema, resolver, backfill mapping, actions (authz, validation, audit), picker, editor, each skin smoke render. `loadLandingMainSections.test.ts` updated.
- [ ] Product changelog entry.
- [ ] Manual QA (user): visual check of each skin on desktop and mobile; switch skins on a site with owner content.

## Resolved questions

1. Mobile: one shared mobile tree for all skins, with owner colors and photos.
2. `idiomas2` quiz and `musica2` audio lab: removed.
3. Preview: the owner sees a live preview with their own content before confirming.
