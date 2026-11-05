# PostgREST: page growing tables, no fixed row caps

**Intent:** A table that can grow without a business ceiling is read in pages. A fixed cap (2000, 5000) is not a substitute for pagination. One PostgREST response never returns more than `max_rows` (1000 in `supabase/config.toml`).

**Done when:**

- `.cursor/rules/13-postgrest-pagination-bounded-queries.mdc` states the 1000-row response ceiling.
- The same rule forbids `.limit(N)` or a single `range` above 1000 on a growing table.
- The same rule requires `range` plus an exact total for those tables, including exports. Each page stays at or below 1000 rows.
- `select("*")` stays forbidden on those tables. Use an explicit column list.
- A catalog with a documented ceiling under 100 rows may keep one bounded read.
- `AGENTS.md` still points at rule 13. The one-line summary mentions pages, not a fixed cap.
- The rule stays in English.

**Out of scope:** Rewriting the current callers (`loadProfilesForUsersExport`, `exportRegistrationsAction`, `resolveParentRecipients`, questionnaire loaders, `loadAdminSectionPageData`, `sitemap.ts`). That is a follow-up.

**Surfaces (Web vs PWA):** No screen change. Rule text only.
