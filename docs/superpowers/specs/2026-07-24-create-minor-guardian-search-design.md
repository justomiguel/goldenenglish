# Create minor student — guardian/tutor search fix

**Date:** 2026-07-24  
**Status:** Approved  
**Type:** Bugfix (admin create-user minor path)

## Understanding

- When creating a **student under legal majority**, the form shows a guardian panel with mode “link existing” that uses `AdminStudentSearchCombobox` + `searchAdminParentsForDetailAction` → `searchAdminParentsByPrefix`.
- The same server search powers the **user-detail** tutor linker, but that surface enables `prefetchWhenEmptyOnFocus` and clearer copy; the create-minor panel does not.
- Staff copy promises search by **name, email, or document**; the query only prefixes `first_name`, `last_name`, and `dni_or_passport`. `profiles` has **no email column** (login email lives in `auth.users`).
- Multi-word queries (e.g. `María García` or surname-first display order) are sent as a **single** ILIKE prefix on each column, so they return **zero rows**, even though `personNameFieldsMatchPrefix` already understands full / last-first prefixes on the client.

## Root cause (investigation)

| Symptom likely seen | Cause |
|---|---|
| Typing full name → empty list | SQL `.or(first_name.ilike.<full>%,…)` does not split tokens / full-name prefixes |
| Searching by email → empty list | Placeholder/copy overpromises; no auth.users email lookup in this action |
| Focusing field → nothing until typing | Create panel omits `prefetchWhenEmptyOnFocus` (detail tutor card has it; empty query already returns a bounded A–Z window of 30 parents) |
| Detail linker “works better” than create | Same action, different combobox wiring + copy |

Not treating silent authz/`assertAdmin` failure as primary (would also break detail tutor search).

## Decision (proposed)

1. **Align create-minor guardian search UX** with the detail tutor picker: enable `prefetchWhenEmptyOnFocus`, stable `excludeIds`, and dictionary copy that matches real capabilities (and detail tooltip semantics).
2. **Fix prefix search semantics** in `searchAdminParentsByPrefix` (shared with detail):
   - Keep empty query → bounded alphabetical `role=parent` window (limit 30).
   - For non-empty query: match **per-token prefix** on first/last/dni **and** support **full-name** / **surname-first** prefix (same intent as `personNameFieldsMatchPrefix`), still bounded to 30 rows.
   - Optional email: if query looks like a full email, resolve via admin auth lookup (same pattern as admin users list `looksLikeFullEmailQuery` + id match) and include that parent when `role=parent`.
3. **Correct i18n** in `en` / `es` / `pt`: create-user guardian placeholder/tooltip must not claim email unless email lookup ships; prefer parity with `detailTutorSearch*` wording.

## Options considered

| Option | Verdict |
|---|---|
| A. Only add `prefetchWhenEmptyOnFocus` on create panel | Rejected alone — leaves full-name / email false promise broken |
| B. Switch create panel to contains (`%q%`) like registrations list | Rejected — breaks staff prefix contract (`14-admin-student-search-combobox.mdc`) |
| C. Fix shared `searchAdminParentsByPrefix` + create UX + copy (this) | **Chosen** — one root fix for create + detail |

## Consequences

- Detail tutor search improves for multi-word / email as well (same module).
- Tests: extend `searchAdminParentsByPrefix` (multi-token, empty window, email path mocked); RTL/hook smoke for create panel prefetch flag; dictionary keys aligned.
- No migration. Observability: existing authz deny log on action stays.
- Manual QA (user): create minor → existing guardian → type surname, full name, DNI; focus empty field for A–Z window; pick + submit link.

## Intent

Make “link existing guardian” when creating a minor student reliably find parent profiles the same way (or better than) the user-detail tutor linker, with honest copy.

## Done when

- [x] Create-minor guardian combobox prefetches bounded list on empty focus.
- [x] Prefix search finds parents by single-token name/DNI **and** multi-word first+last / last+first prefixes.
- [x] Email search works (full-email → auth lookup → parent hit) with aligned copy.
- [x] Dictionaries en/es/pt aligned; Vitest coverage for search module + create panel wiring.

## Out of scope

- Searching non-`parent` roles in this combobox (admin reuse stays on “create new guardian” + confirm flow).
- Changing student prefix search (`searchAdminStudentsByPrefix`) except if a tiny shared helper is extracted and reused.
- Accent-insensitive SQL (unaccent) — follow-up unless already available in DB.

## Risks / mitigation

- Broader `.or()` filters → keep **limit 30** and role filter; unit-test filter construction.
- Auth email lookup adds a round-trip only when query looks like a full email.

## Definition of done

Automated tests green for the above; create + detail guardian pick paths behave consistently; Manual QA checklist left for the user (`32-manual-qa-user-owned`).
