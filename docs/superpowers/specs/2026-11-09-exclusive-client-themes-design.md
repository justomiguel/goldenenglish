# Exclusive client themes (bespoke landings) — design

Status: approved 2026-11-09.

## Context

The repo has two kinds of landing templates. Code does not name the difference.

- **Catalog templates.** `GENERIC_INSTITUTE_KINDS` in `src/lib/theme/genericInstituteTemplates.ts`. CentroListo shows them in `PulsarTemplateCatalog`. The free plan accepts only these.
- **Bespoke templates.** `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`. Each one was built for one client. Each one has its own landing, CMS catalog, `/register` surface, and sometimes an ADR (`docs/adr/2026-05-mimundo-tenant-and-theme-kind.md`).

The user asked for a new academy theme. That theme belongs to one client. Other clients must not see it or use it. The user also asked for a written process for future "special landing" requests.

### Leak found

`LandingEditorOverview.tsx` passes `kinds={undefined}` to `LandingTemplateKindPicker` when the current kind is not generic. The picker then lists all of `SITE_THEME_KINDS`. Result: a Nago admin can switch the site to `mozarthitos`. `setSiteThemeKindAction` does not check ownership. A new bespoke kind would leak the same way.

## Decision

1. Add an explicit **exclusive theme** concept. A pure map names the owner tenant slug for each bespoke kind.
2. The CMS picker shows an exclusive kind only to its owner. The server action rejects a switch to an exclusive kind that the request tenant does not own.
3. Write the intake process in a runbook, a Cursor rule, and an ADR. Future requests ("landing especial para X") follow that process.
4. The new academy theme is **out of scope** here. It comes next, with its own spec, from the intake form.

## Options considered

| Option | Why not chosen |
|---|---|
| Ownership column in `site_themes` or `platform_tenants` (DB) | The theme is code (components, CSS, catalogs). It ships with a deploy anyway. A DB flag adds a migration on every institute and can drift from the code. Rule `46` targets values staff edit after deploy; theme ownership is not one. |
| Separate repo or fork per client | Duplicates auth, CMS, register, billing. High cost on every shared fix. |
| Keep it implicit (documentation only) | The picker leak stays. Every new bespoke kind widens it. |

## Design

### Pure module — `src/lib/theme/exclusiveThemeKinds.ts`

- `EXCLUSIVE_THEME_OWNERS: Readonly<Partial<Record<SiteThemeKind, readonly string[]>>>` — kind → owner tenant slugs. Initial rows: `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`. Owner slugs come from the current tenant registry and `vercel-targets.json`. I confirm each slug during the plan step.
- `isExclusiveThemeKind(kind): boolean`.
- `canTenantUseThemeKind(kind, tenantSlug: string | null): boolean`.
  - A catalog kind or a shared kind (`classic`, `editorial`, `minimal`) → `true`.
  - An exclusive kind → `true` only when `tenantSlug` is in its owner list.
  - `tenantSlug === null` (single-tenant deploy, no registry) → `true`. The database belongs to one client.
- `themeKindsForTenant(tenantSlug, currentKind): SiteThemeKind[]` — the list the picker shows. It always keeps `currentKind`, so the screen never hides the active value.
- No Supabase, React, or Next imports.

### Server — `setSiteThemeKindAction`

- Read the tenant with `resolveRequestTenant()`.
- If `canTenantUseThemeKind(toKind, slug)` is false:
  - Return `{ ok: false, code: "kind_not_available" }`.
  - Log `logServerWarn` with scope `cms.setSiteThemeKind`, `code`, `themeId`, `toKind`, `tenantSlug`.
- The rest of the flow does not change (audit, revalidate).

### UI — CMS overview (Tier B, desktop only)

- `LandingEditorOverview` receives `allowedKinds` from its server parent. The parent computes it with `themeKindsForTenant(...)`. The generic branch stays: a generic tenant still sees only `GENERIC_INSTITUTE_KINDS`.
- `LandingTemplateKindPicker`: no prop change (it already accepts `kinds`).
- New error copy `kindPicker.errors.kind_not_available` in `en.json`, `es.json`, `pt.json`. Sentence names the cause and the code (rule `50`). Example es: "Esta plantilla es exclusiva de otro instituto. Elige otra plantilla. Código: kind_not_available".

### CentroListo catalog

- `buildPulsarTemplateCatalogCards` already reads only `GENERIC_INSTITUTE_KINDS`. Add a test that fails if any exclusive kind enters that list.
- `createOwnerFreeSite` already rejects non-generic kinds. No change.

### Process documents

1. **Runbook** `docs/runbooks/exclusive-landing-request.md` (Spanish, like `add-new-tenant.md`):
   - When a request is "exclusive" vs "use a catalog template + palette".
   - Intake form to copy and fill: client and tenant slug, kind slug, readable name, brand assets (logo, fonts, palette), sections and copy, photos, `/register` surface, Web and PWA, domain, deadline, who approves the design.
   - Steps in order: spec → ADR (`docs/adr/YYYY-MM-<slug>-exclusive-theme.md`) → enum migration (`ALTER TYPE public.site_theme_kind ADD VALUE`) applied with `sql:apply-migration:all-tenants:pg` → `SITE_THEME_KINDS` → owner row in `EXCLUSIVE_THEME_OWNERS` → landing components + CMS catalog → `/register` surface (rule `28`) → dictionaries → tests → changelog entry if staff notice it.
   - Rule: an exclusive kind never enters `GENERIC_INSTITUTE_KINDS` or the CentroListo catalog.
   - Links: `add-new-tenant.md`, rules `19`, `28`, `45`.
2. **Cursor rule** `.cursor/rules/51-exclusive-client-themes.mdc` (English, rule `00`). Trigger: a request for a landing or theme for one specific client. Agent must ask for the intake form first, then follow the runbook. Globs on `src/types/theming.ts`, `src/lib/theme/**`, `src/lib/pulsar/pulsarTemplateCatalog.ts`.
3. **ADR** `docs/adr/2026-11-exclusive-client-themes.md` with Context / Decision / Options / Consequences (rule `10`).
4. Link the runbook from `add-new-tenant.md` §6 and from `AGENTS.md` (always-on rules table).

## Surfaces (Web vs PWA)

- Touched screen: CMS landing overview under `dashboard/admin/cms`. **Tier B — desktop-only (no PWA tree).**
- `LandingTemplateKindPicker` and `LandingEditorOverview` are not used by any Tier A or PWA screen (checked with grep: only `LandingEditorOverview` imports the picker).
- Public landings and `/register` do not change. Their Web and PWA trees stay as they are.

## Analytics and logs

- Existing audit `site_theme_kind_updated` stays for successful switches.
- Rejected switch: `[ge:server]` warn with code `kind_not_available`. No new `user_events` type.

## Tests

- `src/__tests__/lib/theme/exclusiveThemeKinds.test.ts`: owner allowed, other tenant blocked, null tenant allowed, catalog kind allowed, `themeKindsForTenant` keeps the current kind, every exclusive kind is in `SITE_THEME_KINDS` and not in `GENERIC_INSTITUTE_KINDS`.
- `setSiteThemeKindAction` test: other tenant → `kind_not_available` and no update; owner → update runs.
- `LandingTemplateKindPicker` test: `kind_not_available` renders its own sentence with the code (not `persist_failed`); unknown code still shows the raw code.
- `PulsarTemplateCatalog` test: no exclusive kind in the cards.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Wrong owner slug locks a client out of its own theme | `themeKindsForTenant` always keeps the current kind. I confirm each slug against the registry in the plan. |
| A future bespoke kind is added without an owner row | The test fails when a kind is neither shared, generic, nor in `EXCLUSIVE_THEME_OWNERS`. |
| Golden English (`classic`) or shared kinds blocked | Shared kinds are allowed for every tenant by design and by test. |

## Definition of done

- `exclusiveThemeKinds.ts` with tests.
- Picker filtered per tenant, server action guarded, new error copy in three locales.
- CentroListo catalog test.
- Runbook, rule `51`, ADR, links in `add-new-tenant.md` and `AGENTS.md`.
- `vitest` for touched files green, `tsc` and lint clean.
- Manual QA (user): open the CMS overview on two tenants and check the kind list.

## Out of scope

- The new academy theme. It gets its own spec from the intake form.
- Moving theme ownership to the database.
- Changes to public landings or `/register`.
