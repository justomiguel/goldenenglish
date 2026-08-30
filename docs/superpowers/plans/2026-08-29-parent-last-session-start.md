# Parent last access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stamp `profiles.last_session_start_at` on any role’s `session_start`, backfill parents who already have `user_events`, and keep student engagement/churn side effects unchanged.

**Architecture:** The Postgres trigger `user_events_after_insert` is the write path. A small pure module in `src/lib/analytics/` documents the same role split so Vitest can lock the contract without a live database. Admin Padres already reads the column; no UI change.

**Tech Stack:** Postgres trigger (SECURITY DEFINER), Supabase migrations, Vitest, product changelog catalog.

## Global Constraints

- Source of truth stays `profiles.last_session_start_at` (never `auth.users.last_sign_in_at`).
- `engagement_points` and `churn_notified_at = NULL` remain student-only.
- Backfill is additive, parents-only, and only when the new timestamp is newer than the current value.
- Tests self-contained under `src/__tests__/`.
- File size ≤ 250 lines.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/analytics/userEventsAfterInsertEffects.ts` | Pure policy: stamp / clear churn / award engagement; parent backfill pick. |
| `src/__tests__/lib/analytics/userEventsAfterInsertEffects.test.ts` | Isolated contract tests. |
| `supabase/migrations/200_parent_last_session_start.sql` | Replace trigger + parent backfill. |
| `src/lib/product-changelog/catalog.ts` | Staff-visible note that Padres last access is now real. |
| Spec + this plan | Approved design + execution record. |

---

## Task 1: Policy module (TDD)

- [x] Write failing tests for:
  - parent `session_start` → stamp, no churn clear, no engagement
  - student `session_start` → stamp + clear churn
  - student `page_view` `material:…` → engagement only
  - teacher `session_start` → stamp, no student side effects
  - null role → no effects
  - parent backfill prefers latest `session_start`, else any event; does not overwrite a newer current value
- [x] Run the file alone; confirm RED.
- [x] Implement `userEventsAfterInsertEffects` and `parentLastSessionBackfillAt`.
- [x] Run the file alone; confirm GREEN.

## Task 2: Migration

- [x] Add `200_parent_last_session_start.sql`:
  - Recreate `user_events_after_insert` matching the policy (null `user_id` still no-ops).
  - Backfill parents from `MAX(session_start)` else `MAX(any user_events)`, only if null or older.
- [x] Do not regenerate `masterdb.sql`.

## Task 3: Changelog + wrap

- [x] Prepend a `parent` (or `admin`) changelog entry dated `2026-08-29`.
- [x] Mark spec Approved.
- [ ] Commit spec + plan + implementation together on `main` if the tree has no unrelated WIP; otherwise ask.
