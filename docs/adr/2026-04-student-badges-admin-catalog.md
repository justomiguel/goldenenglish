# ADR: Admin-managed student badge catalog

## Context

The first version of student badges (ADR `2026-04-student-badges-and-public-shares.md`) hardcoded six badges in `src/lib/badges/badgeCodes.ts` plus their criteria thresholds in `src/lib/badges/badgeEligibility.ts` and their copy in `src/dictionaries/{en,es}.json`. Adding, retitling or pausing a badge required a developer PR and a deploy. Marketing and product asked for an admin surface to: see the catalog, edit titles/descriptions in both locales, attach a custom image (vs the institute logo currently used in the OG share preview), pause without losing prior grants, and create new badges by picking a pre-approved criterion type and a numeric threshold.

This ADR supersedes the “fixed catalog / dev-only” excerpt of the previous ADR and adds a real domain entity for the badge catalog while keeping `student_badge_grants` and the public-share contract intact.

## Decision

- **Bounded criteria DSL.** Admin can pick a `criteria_type` from a closed enum (`tasks_completed`, `attendance_streak`, `profile_complete`, `assessments_passed`) and an integer `criteria_threshold`. New criterion **types** still need a dev PR — this trades flexibility for predictability and testability and keeps the runtime evaluator small.
- **New tables in migration `082_student_badges_catalog.sql`.**
  - `public.badge_catalog (id uuid PK, code text unique, category badge_category, criteria_type badge_criteria_type, criteria_threshold int, image_path text NULL, is_active bool, sort_order int, created_at, updated_at, updated_by)`.
  - `public.badge_translations (badge_id FK, locale text, title, description, PK(badge_id, locale))`.
  - `student_badge_grants` gains a nullable `badge_id uuid` FK + backfill from `badge_code` for existing rows. `badge_code` stays as the stable share-page identifier (preserves backwards compatibility for any grant already linked from WhatsApp).
- **Seed.** The migration inserts the six current hardcoded badges (`tasks_completed_1`, `tasks_completed_5`, `tasks_completed_10`, `attendance_streak_5`, `profile_complete`, `first_assessment_passed`) with their existing categories, criteria, and ES/EN translations copied from the dictionaries — every existing grant keeps working.
- **RLS.** `badge_catalog` and `badge_translations` are SELECT-public for `is_active = TRUE` rows (so the share page and student/parent dashboards can read them as anon/authenticated) and admin-only for INSERT/UPDATE/DELETE. Public read of inactive rows is forbidden.
- **Public share RPC.** A new `public.get_public_badge_catalog_entry(p_code text)` returns the active catalog entry plus all translations and the image path, for the `/[locale]/b/[token]` page. The existing `get_public_student_badge_share(p_token uuid)` is unchanged.
- **Storage.** New bucket `badge-images` (public read, admin write) in migration `083_badge_images_storage.sql`, mirroring `landing-media` from `046_site_themes.sql`.
- **Generic evaluator.** `src/lib/badges/badgeEligibility.ts` is replaced by `evaluateBadgeCatalogEligibility(ctx, catalog)` that iterates the catalog and applies each entry's `criteria_type` + `criteria_threshold`. The hardcoded thresholds live only in seed data after the migration.
- **Hooks unchanged.** All existing call sites of `awardStudentBadges` keep their signature; the function now reads the catalog via `loadBadgeCatalog` (cached per request) and inserts grants with both `badge_code` (for share-page back-compat) and `badge_id` (for joins).
- **Admin surface.** New Tier B desktop-only pages under `dashboard/admin/badges/` (list, edit, create) with a single `actions.ts` providing `createBadgeAction`, `updateBadgeAction`, `archiveBadgeAction`, `restoreBadgeAction`, `uploadBadgeImageAction`, all gated by `assertAdmin` and audited via `auditAcademicAction` (domain `academic` — gamification is a learning-side product feature).
- **i18n.** Dictionary `dashboard.student.badges.definitions.<code>` becomes a fallback only (used when the catalog row or translation is missing in the same locale). Admin surface copy lives in `admin.badges.*` keys in `en.json` + `es.json`. Brand name and category labels stay in the dictionary.
- **Extensibility cap.** The criteria DSL is intentionally not nested (no AND/OR composition). If a future badge needs combined conditions, that is a new ADR + a new criterion type, not a UI feature.

## Options considered

- **Free JSON DSL with AND/OR.** Rejected for v1: opens the door to invalid configs, requires a dry-run sandbox before activation, and doubles test surface. Closed enum covers 100% of the current six badges.
- **Move criteria to `badge_translations.metadata` JSONB.** Rejected: criterion threshold is data, not copy; keeping it as typed columns lets PostgREST and tests reason about it.
- **Drop `badge_code` and use `badge_id` only as the stable id.** Rejected: existing grants are referenced by `public_share_token` only, but staff-readable analytics joined `badge_code` historically (`section:student_badges` events). Preserving the string code costs nothing.
- **Per-row image override on `student_badge_grants`.** Rejected: the share preview is per-badge, not per-grant; per-grant images would explode storage and break global rebrands.

## Consequences

- A migration backfill copies `badge_id` for every existing grant; if the seed list ever loses a code, those grants would have `badge_id IS NULL` (the share page falls back gracefully to the dictionary translation).
- Admin can pause a badge (`is_active = false`); the evaluator stops awarding it, but existing grants remain visible to the student/parent and the share page. Public catalog RPC returns `NULL` for paused codes — share preview falls back to dictionary copy.
- Admin can change `criteria_threshold` of an active badge. Past grants are not revoked. Future evaluations use the new threshold. This is intentional — same behaviour Google/Apple use for "achievement requirements changed".
- The OG image (`opengraph-image.tsx`) now resolves a per-badge image from `badge_images` storage when present; falls back to the institute logo + title when absent. The cache key (token) is unchanged so WhatsApp's per-URL cache stays valid.
- New surfaces: `admin/badges` page, `admin/badges/new`, `admin/badges/[badgeId]`. Sidebar gains a "Badges" entry under the academic group.

## Tests

- `src/__tests__/lib/badges/badgeCatalogEvaluator.test.ts` — generic evaluator with mock catalog (replaces `badgeEligibility.test.ts`).
- `src/__tests__/lib/badges/loadBadgeCatalog.test.ts` — catalog loader RPC mock.
- `src/__tests__/app/adminBadgeActions.test.ts` — admin CRUD actions: forbidden when not admin, validation, audit emitted, idempotent archive/restore.
- Existing `attendanceStreak.test.ts` keeps applying.

## References

- Previous ADR: `docs/adr/2026-04-student-badges-and-public-shares.md`.
- Storage pattern: `supabase/migrations/046_site_themes.sql` (landing-media bucket).
- Audit pattern: `src/lib/audit/domainAudit.ts` (`auditAcademicAction`).
- Boundaries: `.cursor/rules/12-supabase-app-boundaries.mdc`, `.cursor/rules/15-entity-crud-completeness.mdc`, `.cursor/rules/13-postgrest-pagination-bounded-queries.mdc` (catalog cap small enough for full read in v1; documented here).
