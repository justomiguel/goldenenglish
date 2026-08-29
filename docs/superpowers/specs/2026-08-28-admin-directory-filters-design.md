# Admin directory filters with faceted counts

**Date:** 2026-08-28
**Status:** Implementing on main
**Kind:** Design spec. Implementation plan after this file is approved.
**Governing rules:** `03-architecture.mdc` (250-line ceiling), `09-i18n-copy.mdc` (es / en / pt, no hardcoded UI), `30-harness-self-contained-tests.mdc`.

**Related:**

- Locked-role directories: `/admin/students`, `/admin/teachers`, `/admin/parents`
- Parents list filters already in URL: `q`, `section`, `access`
- Messages collapsible chrome: `AdminPortalMessagesFilters`
- Role combo counts: `AdminUsersToolbar` + `loadAdminUsersListRoleCounts`
- Parent invite/compose scope: `parseParentRecipientScope` + `resolveParentRecipients`

## Intent

Admins can narrow Alumnos, Profes, and Padres with the same collapsible combo panel. Each option shows how many people **would remain if that option is chosen**, given the other filters and the search box. Parent bulk invite/mail keep matching the visible list.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Surfaces | Alumnos, Profes, and Padres. Not the unlocked Usuarios list |
| Chrome | Collapsible “Filtros” button beside search (Messages pattern: icon + chevron + panel). Search stays outside. Padres Invitar / Enviar mail stay outside |
| Default | Panel closed. Opens when any **filter** param is in the URL (not `q`). Active filters show a dot on the button |
| Counts | **Faceted.** For combo X, apply every other filter + `q`, then count each option of X |
| “Todas” | Count = people matching the other filters + `q` (this combo unconstrained) |
| URL | Omit default/`all` values. Invalid values ignored (treat as unconstrained) |
| Course grain | Academic **section**, not cohort. Same `loadActiveSectionFilterOptions` list (non-archived, name order, cap 200) |
| Last access | `profiles.last_session_start_at`. Null = never. Do not use `auth.users.last_sign_in_at` |
| Phone | Empty or null = without. Same as people-stats “with phone” |
| Alta | `profiles.created_at` vs UTC now − 30 days (same window as `loadAdminPeoplePageStats`) |
| Parent mail | Invite/compose filter scope includes the new Padres params. Selected-id sends unchanged |
| Persistence | No migrations, no new tables, no new RBAC |

## Done when

1. Alumnos, Profes, and Padres show a collapsible **Filtros** panel. Search (and Padres actions) stay visible when the panel is closed.
2. Combos per list match the map below. Each `<option>` is `{{label}} ({{count}})` via i18n (es / en / pt).
3. Changing a combo writes the URL, resets `page`, and reloads the **full** filtered set (not the current page only).
4. Counts are faceted as defined above. A person in two sections increments both section options.
5. **Limpiar filtros** shows only when a filter param is set; it drops filter params and keeps `q`.
6. Padres Invitar / Enviar mail with no row selected use the same filter set as the table (including the new Padres combos).
7. Isolated tests cover param parse, list filter application, faceted counts, parent scope parse/resolve, and the panel open/dot/clear behavior.

## Out of scope

- Unlocked `/admin/users` role list
- Cohort-level filter
- New KPI cards or changing `AdminPeopleStatsRow`
- Bulk mail/invite for students or teachers
- Filtering the current page only
- New database objects
- Teacher “titular vs asistente” as a column (filter only)

## Approaches considered

1. Independent (global) counts like the Usuarios role combo. Rejected: numbers lie once another filter is on.
2. Filter drawer / sheet. Rejected: heavier and unlike the rest of admin.
3. **Collapsible panel + faceted counts (chosen).** Same chrome as Mensajes. Option label = remaining people if chosen.

## Filter map

Omit the param when the combo is unconstrained (`all` / empty).

| URL key | Values | Alumnos | Padres | Profes | Meaning |
|---|---|---|---|---|---|
| `section` | section uuid | yes | yes | yes | Active section. Profes: lead **or** assistant unless `teachingRole` narrows it |
| `access` | `never` \| `entered` | yes | yes | yes | `last_session_start_at` null vs not null |
| `phone` | `with` \| `without` | yes | yes | yes | Profile phone present vs empty/null |
| `created` | `last30` \| `older` | yes | yes | yes | `created_at` ≥ / < UTC now − 30 days |
| `enrollment` | `with` \| `without` | yes | — | yes | Alumnos: active `section_enrollments`. Profes: ≥1 non-archived lead or assistant assignment |
| `teachingRole` | `lead` \| `assistant` | — | — | yes | Titular (`academic_sections.teacher_id`) vs `academic_section_assistants` |
| `parentLink` | `with` \| `without` | yes | — | — | ≥1 tutor/guardian link vs none |
| `scholarship` | `with` \| `without` | yes | — | — | Active scholarship with `discount_percent` > 0 on an active enrollment |
| `due` | `with` \| `without` | yes | — | — | Current-month monthly due after scholarships, any currency total > 0 (same source as the directory “cuota” column) |
| `email` | `deliverable` \| `none` | — | yes | — | `isDeliverableAuthEmail` vs synthetic/missing |
| `children` | `with` \| `without` | — | yes | — | ≥1 linked student vs none |

`section` + `enrollment=without` (or Profes `teachingRole` that cannot match that section) yields an empty list. Facets must show `0` on the impossible options.

## Screen

Reuse `AdminUsersToolbar` search row. On locked-role directories (`student` / `teacher` / `parent`):

1. Search input (unchanged).
2. **Filtros** button (`aria-expanded`, `aria-controls`, chevron). Dot when any filter param is set.
3. Padres: Invitar + Enviar mail stay below the search row, outside the panel.
4. Panel: labeled `<select>` grid (2 columns from `sm`), Messages-like card. **Limpiar filtros** at the bottom when active.

Do not reuse the Usuarios “Filtros” disclosure that only holds the role combo (`lockRole` still hides that).

Narrow / PWA list uses the same toolbar.

## Architecture

Shared client: `AdminDirectoryFilterPanel` (chrome + grid). Each page passes the combos for that role plus current values and facet counts.

Shared parse: extend `lockedRoleUsersParams` so **all three** locked roles read the keys they support. Today only Padres keep `section` / `access`.

Shared list filter: extend `PaginatedAdminUsersParams` and apply filters inside `loadPaginatedAdminUsers` (or a helper it calls). Profile-level filters (`access`, `phone`, `created`) stay on the `profiles` query. Relation filters (`section`, `enrollment`, `teachingRole`, `parentLink`, `scholarship`, `due`, `email`, `children`) restrict ids before `range`. If `loadPaginatedAdminUsers` would exceed 250 lines, extract apply/id-resolution — do not grow the file.

Shared facets: `loadAdminDirectoryFilterFacets(role, params)` returns counts per combo option, including section ids. Implementation: load the role’s candidate ids + the columns needed for facets (after `q` only), attach the same extras the list already uses, then count in memory **once per dimension with that dimension removed**. Institutes are hundreds of rows; do not add an RPC.

Padres actions: extend `ParentRecipientScope` filter variant and `resolveParentRecipients` with `phone`, `created`, `email`, `children`. `AdminParentsScreen` `scopeParams` must forward them. Compose URL / invite form already pass the filter query through; keep that path.

Section options: existing `loadActiveSectionFilterOptions` on all three pages.

## Error handling

- Unknown URL values → unconstrained (no error toast).
- Unknown `section` id → apply it; list and that option’s count are empty; other options still facet.
- Facet or extra query failure → log with `logSupabaseClientError`, show the list if the main query succeeded, counts `0`.
- Parent email facet needs auth emails; reuse the same deliverable helper. If an email lookup fails for one id, treat that id as `none`.

## Testing

Self-contained Vitest only (no live Supabase). Cover:

- `lockedRoleUsersParams` keeps the new keys per role and drops invalid values.
- List loader applies combinations (section + access, `enrollment=without`, teacher lead vs assistant, student scholarship/due).
- Facets: with `access=never`, section counts only include never-entered people; “Todas” on access equals the other-filters total.
- `parseParentRecipientScope` + `resolveParentRecipients` honor `phone` / `created` / `email` / `children`.
- Panel: closed with no filter params; open + dot when `access=never`; clear keeps `q`.

## i18n

New keys under `admin.users` (shared labels) or `admin.directoryFilters` (preferred, one block). Reuse Padres `filterSection` / `filterAccess*` where the wording already matches. No hardcoded option text. Format: existing `roleFilterOptionWithCount` (`{{label}} ({{count}})`).
