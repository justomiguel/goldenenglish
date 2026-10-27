# Teacher birthdays in portal and View-As mode

**Spec:** `docs/superpowers/specs/2026-10-27-teacher-birthdays-view-as-design.md`

## Steps

1. Add a failing page test: `/dashboard/teacher/calendar` loads birthdays for `viewerId` when an admin uses View-As.
2. Pass `viewerId` from `getDashboardActor()` on the teacher calendar page. Allow the page when `viewAs` is set.
3. Add a failing SQL contract test for migration `225`.
4. Ship `225_portal_upcoming_birthdays_view_as.sql`. Allow `p_viewer_id <> auth.uid()` only when `public.is_admin(auth.uid())`. Scope section staff through `user_leads_or_assists_section`. Include students whose `assigned_teacher_id` is the teacher viewer.
5. Mirror the function in `supabase/migrations/masterdb.sql`.
6. Update `docs/adr/2026-05-portal-student-birthdays.md`.
7. Apply migration `225` to configured tenant databases.
8. Run the new Vitest files.
