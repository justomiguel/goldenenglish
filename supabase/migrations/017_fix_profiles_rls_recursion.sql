-- Fix: infinite recursion in profiles RLS policies (42P17).
--
-- Several SELECT policies on `profiles` contain subqueries like
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
-- which re-trigger the same SELECT policies → infinite recursion.
--
-- Solution: a generic SECURITY DEFINER helper `user_has_role(uid, role_name)` that
-- bypasses RLS (like the existing `is_admin`), and rewrite every self-referencing
-- policy on `profiles` to use it instead of inline subqueries.

-- 1. Generic role check (SECURITY DEFINER = bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.user_has_role(uid uuid, r text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = r::public.user_role
  );
$$;

COMMENT ON FUNCTION public.user_has_role(uuid, text) IS
  'SECURITY DEFINER: checks profiles.role without triggering RLS on profiles. Use in RLS policies that reference the same table.';

-- Helper: read a single column from a profile row bypassing RLS.
-- Needed for policies that check the *target* row''s role or teacher assignment.
CREATE OR REPLACE FUNCTION public.profile_role(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text FROM public.profiles p WHERE p.id = uid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.profile_assigned_teacher(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.assigned_teacher_id FROM public.profiles p WHERE p.id = uid LIMIT 1;
$$;

-- 2. Rewrite self-referencing SELECT policies on profiles ---------------------

-- profiles_select_teacher_for_messaging (from 016): teacher can see all profiles for compose.
DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'teacher')
    AND profiles.role IN ('student', 'parent', 'teacher', 'admin')
  );

-- profiles_select_teacher_via_messages (from 016): teacher sees student/parent profiles
-- they've exchanged portal_messages with.
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'teacher')
    AND public.profile_role(profiles.id) IN ('student', 'parent')
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

-- profiles_select_teachers_assigned_to_tutored_students (from 016):
-- parents see teacher profiles linked through their tutored students' assigned_teacher_id.
DROP POLICY IF EXISTS profiles_select_teachers_assigned_to_tutored_students ON public.profiles;
CREATE POLICY profiles_select_teachers_assigned_to_tutored_students ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'parent')
    AND profiles.role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND public.profile_assigned_teacher(ts.student_id) = profiles.id
    )
  );

-- 3. Policies on OTHER tables that had inline profiles subqueries (not recursive
--    on profiles, but cleaner/safer to use the helper too) --------------------

-- portal_messages INSERT: teacher, admin, parent checks
DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'teacher')
    AND public.profile_role(recipient_id) IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'admin')
    AND public.profile_role(recipient_id) IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'parent')
    AND public.profile_role(recipient_id) = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid()
        AND public.profile_assigned_teacher(ts.student_id) = recipient_id
    )
  );

-- enrollments_select (from 011): teacher check was inline
DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select
  ON public.enrollments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = enrollments.student_id
    )
  );

-- attendance_select (from 011): teacher check was inline
DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select
  ON public.attendance FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = attendance.student_id
    )
  );

-- payments_update_student_own (from 005): student check was inline
DROP POLICY IF EXISTS payments_update_student_own ON public.payments;
CREATE POLICY payments_update_student_own ON public.payments
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
    AND public.user_has_role(auth.uid(), 'student')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );
