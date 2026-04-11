-- Student portal: optional teacher assignment, student↔teacher messages, student payment receipt updates.
-- Run after 002_platform_phase.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_assigned_teacher_idx
  ON public.profiles (assigned_teacher_id);

CREATE TABLE IF NOT EXISTS public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reply_html TEXT,
  replied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS student_messages_student_idx
  ON public.student_messages (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_messages_teacher_idx
  ON public.student_messages (teacher_id, created_at DESC);

ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_messages_select ON public.student_messages;
CREATE POLICY student_messages_select ON public.student_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS student_messages_insert ON public.student_messages;
CREATE POLICY student_messages_insert ON public.student_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = teacher_id AND t.role = 'teacher')
  );

DROP POLICY IF EXISTS student_messages_teacher_update ON public.student_messages;
CREATE POLICY student_messages_teacher_update ON public.student_messages
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS student_messages_student_delete ON public.student_messages;
CREATE POLICY student_messages_student_delete ON public.student_messages
  FOR DELETE TO authenticated
  USING (
    student_id = auth.uid()
    AND reply_html IS NULL
  );

DROP POLICY IF EXISTS student_messages_admin_all ON public.student_messages;
CREATE POLICY student_messages_admin_all ON public.student_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Teachers may read basic profile rows for students they message with.
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_messages m
      WHERE m.student_id = profiles.id AND m.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_update_student_own ON public.payments;
CREATE POLICY payments_update_student_own ON public.payments
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'student')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
  );
