# Teacher birthdays in portal and View-As mode

**Date:** 2026-10-27
**Status:** Approved and implemented
**Related ADR:** `docs/adr/2026-05-portal-student-birthdays.md`

## Intent

Fix student birthday loading when viewing the teacher portal (both on `/dashboard/teacher` and `/dashboard/teacher/calendar`), including when an admin uses "View as" (`ge_view_as`) to inspect a teacher's portal or when a non-teacher profile leads or assists a section.

## Context and root cause

1. `public.portal_upcoming_birthdays_for_viewer(p_viewer_id, p_range_start, p_range_end)` (`supabase/migrations/105_portal_upcoming_birthdays_for_viewer.sql`) raises `42501 forbidden` whenever `auth.uid() IS NOT NULL AND p_viewer_id <> auth.uid()`. When an admin uses View-As (`actor.viewerId <> user.id`), the session JWT still belongs to the admin (`auth.uid()`), so the RPC fails with `42501 forbidden` and `fetchPortalBirthdaysForViewer` returns `[]`.
2. In `public.portal_upcoming_birthdays_for_viewer`, the section-staff branch requires `v_role = 'teacher'` in addition to `public.user_leads_or_assists_section(p_viewer_id, se.section_id)`. Profiles with another role that lead or assist a section (or students linked via `profiles.assigned_teacher_id` for a teacher) miss birthday rows.
3. `src/app/[locale]/dashboard/teacher/calendar/page.tsx` passes `user.id` instead of `viewerId = actor?.viewerId ?? user.id` from `getDashboardActor()`, so the teacher calendar does not use the impersonated teacher in View-As mode.

## Proposed changes

1. **Database migration (`supabase/migrations/225_portal_upcoming_birthdays_view_as.sql` + `supabase/migrations/masterdb.sql`):**
   - Allow `p_viewer_id <> auth.uid()` when `public.is_admin(auth.uid())` is true.
   - Allow any viewer where `public.user_leads_or_assists_section(p_viewer_id, se.section_id)` is true for an active enrollment in a non-archived section (without requiring `v_role = 'teacher'`), plus `v_role = 'teacher' AND pr.assigned_teacher_id = p_viewer_id`.
2. **Teacher calendar page (`src/app/[locale]/dashboard/teacher/calendar/page.tsx`):**
   - Resolve `actor = await getDashboardActor()` and `viewerId = actor?.viewerId ?? user.id`.
   - Allow entry when `allowed || Boolean(actor?.viewAs)`.
   - Pass `viewerId` to `buildPortalCalendarPagePayload` and `PortalCalendarEntry`.
3. **ADR update (`docs/adr/2026-05-portal-student-birthdays.md`):**
   - Document that admin sessions in View-As mode may pass `p_viewer_id <> auth.uid()` Verified by `public.is_admin(auth.uid())`.
4. **Tests:**
   - Add unit tests for `TeacherCalendarPage` View-As `viewerId` wiring and migration contract verification.

## Done when

- `portal_upcoming_birthdays_for_viewer` allows `p_viewer_id <> auth.uid()` when `public.is_admin(auth.uid())` is true and scopes birthdays to `p_viewer_id`.
- Section leads/assistants and assigned teachers receive birthday rows for their students.
- `/dashboard/teacher` and `/dashboard/teacher/calendar` load birthdays for `viewerId` both in direct teacher sessions and in admin View-As mode.
- Automated Vitest tests pass.

## Out of scope

- Changing the two-week birthday window on dashboard home cards.
- Allowing mutations while View-As mode is active.
