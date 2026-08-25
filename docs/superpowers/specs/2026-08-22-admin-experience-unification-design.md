# Admin experience unification

**Date:** 2026-08-22
**Status:** Ready to execute (extends the approved surface-language umbrella)
**Kind:** Umbrella. Child minis live in [`admin-experience/`](admin-experience/).

**Depends on:** [`2026-08-21-admin-surface-language-design.md`](2026-08-21-admin-surface-language-design.md) — header, icons, Instituto tiles. This spec does **not** reopen IA, routes, or Home.

**Plan:** [`../plans/2026-08-22-admin-experience-unification.md`](../plans/2026-08-22-admin-experience-unification.md)

## Intent

An admin who leaves Alumnos and opens Eventos, Finanzas, una ficha, o el editor de templates must still feel they are in the same product. The 2026-08-21 language shipped the **banner**. Bodies still mix old `layout-border-radius` surfaces, secondary CTAs, raw `h1`s in editors, and custom toolbars.

The reference is **Alumnos / Profesores / Inscripciones**: banner + optional KPI row + white `rounded-2xl` card + wide search + primary CTA + sky pills + icon Acciones + primary pagination.

This is an **experience contract**, not a second IA pass. Routes, loaders, filters, forms, tours, and table columns stay.

## Why now

Mini 00–08 of the surface-language family made titles primary. A later page-by-page chrome sweep aligned many cards. What remains is uneven **interaction chrome**: some lists still look like the old workplace, editors still use a bare `h1`, and `UniversalListView` (audit, people table shell) still wraps tables in the old radius.

## Approaches considered

1. **Contract + shared shells, then apply by family (chosen).** Lock five page types. Fix the one shared table wrapper first. Then editors, academic, finance, Instituto lists, fichas. Each wave is independently testable.
2. Restyle every leftover file in one dump. Unreviewable; new pages will drift again.
3. Token-only CSS. Radius changes, but editors stay banner-less and Acciones stay mixed.

## Page types (normative)

Every `/admin` destination is exactly one type. Do not invent a sixth.

| Type | Examples | Required chrome |
|------|----------|-----------------|
| **List** | Alumnos, Inscripciones, Eventos, Audit, Blog, Badges | `AdminPageHeader` + optional `AdminStatCard` row (only if counts already exist) + white list card + toolbar (search if the page already searches) + primary primary-CTA + sky status/role pill + muted Acciones header + icon or primary text actions + `TablePagination` when paginated |
| **Hub** | Instituto, CMS, Cohortes, Finanzas | `AdminPageHeader` + tile/tab card `rounded-2xl` `bg-background` `shadow-soft` |
| **Form** | Alta usuario, import CSV, evento nuevo, settings | `AdminPageHeader` + one or more `AdminSurfaceCard` (or the same classes) |
| **Detail** | Ficha, event detail, message thread, cohort, section, receipt, billing | Primary back link + `AdminPageHeader` (or identity hero for a person name) + body cards in the list language |
| **Editor** | Theme / landing / hero / raw / blog article | `AdminPageHeader` above the existing canvas. Preview/canvas stay. No new IA. |
| **Wizard** | Site setup | `AdminPageHeader` `iconId="siteSetup"` once at the top. Step chrome may stay. |

Redirect-only routes (`/admin/payments`, `/requests`, `/retention`, `/finance/receipts`, `/finance/collections`, `/academics`) have no UI. Skip.

## Shared tokens (normative)

Copy these strings. Do not invent a second card.

| Token | Value |
|-------|--------|
| Banner | `AdminPageHeader` — already shipped |
| Body card | `rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]` |
| Form card padding | `p-5 md:p-6` |
| Table card | same body card, overflow hidden; no `bg-surface`, no `shadow-card`, no `rounded-[var(--layout-border-radius)]` on **shells** |
| KPI | `AdminStatCard` — primary number, colored icon circle |
| Primary CTA | `rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]` |
| Ghost / filter | border + background, not `variant="secondary"` |
| Destructive | `--color-error` |
| Role / status pill | `rounded-full bg-sky-100 text-sky-800` |
| Back link | `text-sm font-medium text-[var(--color-primary)] hover:underline` |
| Section `h2` | `font-semibold text-[var(--color-primary)]` |
| Pagination active | already primary circle in `TablePagination` |

`--color-secondary` stays only for: Home Impulsa, message **body** HTML, public/hero previews, chart series that already use it as a data color.

## Inputs keep the form token

`rounded-[var(--layout-border-radius)]` on **inputs/selects** is allowed. It is not allowed on page shells, tables, KPI cards, or editor title rows.

## KPI rule

Add or keep an `AdminStatCard` row **only** when the page already loads the counts (people, registrations, messages, events, finance hub). Do not add RPCs to invent KPIs. Do not invent trend copy.

## Acciones rule

If the list already has row actions, they become:

- **View / Manage** — primary ghost or icon (`Eye` / existing label)
- **Edit** — ghost + `Pencil`
- **Delete / Retire** — error text or icon, confirm modal stays

Do not add Acciones to lists that have none.

## Editor leftover `h1`s (must become `AdminPageHeader`)

These still render a raw primary `h1` instead of the banner:

- `SiteThemeEditorShell.tsx`
- `SiteThemeRawEditorShell.tsx`
- `LandingEditorOverview.tsx`
- `LandingSectionEditorShell.tsx`
- `HeroVisualEditorShellTop.tsx`
- `SiteSetupWizard.tsx`
- `BootstrapAdminForm.tsx`
- `BlogArticleEditor.tsx` (no page title today — add `AdminPageHeader` using existing `admin.cms.blog.list.title` for edit and `admin.cms.blog.list.create` for new; do not add new nouns)

Academic section name stays an editable `h1` (it is the **section name**, not a page title). Wrap the existing `AcademicSectionPageHeader` in the banner classes already applied; do not force `AdminPageHeader` over the name editor.

User ficha display name stays an identity `h1` in `AdminUserIdentityHero`.

Home greeting stays custom (reference).

## Out of scope

- New routes, RPCs, migrations
- Rebuilding tables into galleries
- Home metric cards or Impulsa
- Teacher / parent / student **content**
- Public landings, register, event public pages
- Renaming `data-tour` ids
- New product nouns in `es` / `en` / `pt`
- Commits until the user asks

## Waves

| Mini | File | Scope |
|------|------|-------|
| 00 | [`admin-experience/00-list-shell.md`](admin-experience/00-list-shell.md) | `UniversalListView` + optional `AdminBackLink` |
| 01 | [`admin-experience/01-editors-and-wizard.md`](admin-experience/01-editors-and-wizard.md) | CMS editors, blog editor, site-setup title |
| 02 | [`admin-experience/02-academic.md`](admin-experience/02-academic.md) | Section/cohort body cards, contents list |
| 03 | [`admin-experience/03-finance.md`](admin-experience/03-finance.md) | Inbox, collections, receipts, billing panels |
| 04 | [`admin-experience/04-institute-lists.md`](admin-experience/04-institute-lists.md) | Events, badges, coupons, promotions, blog, audit, glossary, calendar special |
| 05 | [`admin-experience/05-details-and-pwa.md`](admin-experience/05-details-and-pwa.md) | Ficha leftovers, PWA admin lists |
| 06 | [`admin-experience/06-verify.md`](admin-experience/06-verify.md) | Grep + tour + family tests |

## Done when (umbrella)

1. `UniversalListView` table wrapper uses the body-card classes (people, audit, and any other consumer inherit it).
2. The editor/wizard `h1` list above is empty — they render `AdminPageHeader`.
3. Grep for admin **shell** classes `bg-[var(--color-surface)]` + `rounded-[var(--layout-border-radius)]` in list/hub/form/detail wrappers returns nothing (inputs and message-body HTML excluded).
4. No admin chrome `h2` uses `--color-secondary`.
5. Each mini’s Done when is true.
6. Existing tours still find their anchors.

## Manual QA

Owned by the user.

1. Alumnos still looks like today (do not regress).
2. Open every daily drawer item: same banner language, body is a white rounded card.
3. Instituto: click every tile — header + body match Alumnos, not the old surface.
4. Open one CMS editor and Site setup: banner present, canvas/steps still work.
5. Open one ficha and one event detail: primary back + banner + white cards.
6. Phone: admin lists still usable; no secondary sort chips.
