# Parent last access (`last_session_start_at`)

**Date:** 2026-08-29  
**Status:** Approved  
**Kind:** Mini-spec (bugfix)  
**Related:**
- [`2026-08-28-admin-parents-directory-and-bulk-mail-design.md`](2026-08-28-admin-parents-directory-and-bulk-mail-design.md) — last access column and `access` filter
- [`2026-08-28-admin-directory-filters-design.md`](2026-08-28-admin-directory-filters-design.md) — `last_session_start_at` is the source of truth

**Governing rules:** `08-analytics-observability.mdc`, `21-migrations-production-no-data-destruction.mdc`, `30-harness-self-contained-tests.mdc`.

## Intent

Admin **Padres** shows a real last access (relative date) when a parent has opened the platform. **Nunca** only when they never generated a signed-in `session_start`. Filters `never` / `entered` match that same field.

## Root cause

`public.user_events_after_insert` (migrations `010`, `155`) updates `profiles.last_session_start_at` only when `profiles.role = 'student'`. Parents already emit `session_start` via `AnalyticsProvider`; the trigger returns early, so the column stays null and the directory always shows **Nunca**.

## Decisions

| Topic | Choice |
|-------|--------|
| Source of truth | Keep `profiles.last_session_start_at`. Do not use `auth.users.last_sign_in_at`. |
| Who the trigger stamps | Any profile with a role. `session_start` writes `last_session_start_at`. |
| Student-only side effects | Unchanged: `engagement_points` on `page_view` `material:%`; `churn_notified_at = NULL` only when role is `student`. |
| Historical rows | Backfill parents: `MAX(created_at)` of their `session_start` events. If none, `MAX(created_at)` of any `user_events` row for that parent. Only fill when current value is null or older. |
| UI / i18n | No copy or column changes. |

## Done when

1. A parent `session_start` insert sets `profiles.last_session_start_at`.
2. A student `session_start` still sets `last_session_start_at` and clears `churn_notified_at`.
3. A non-student `session_start` does not change `engagement_points` or clear `churn_notified_at`.
4. Existing parents who already have `user_events` get a backfilled timestamp; those with none stay null (**Nunca**).
5. Isolated tests document the role split (student engagement/churn vs last-access for any role).

## Out of scope

- Showing last access on teachers / staff directories
- Changing `formatParentLastAccess` or directory columns
- Using Auth `last_sign_in_at`
- New event types or analytics RPCs
- Regenerating `masterdb.sql` (incremental migration is enough; regenerate later if desired)
