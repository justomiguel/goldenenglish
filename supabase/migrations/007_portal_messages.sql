-- Unified portal messaging: role-based send/receive rules.
-- Replaces student_messages (student→teacher threads with reply_html on same row).

CREATE TABLE IF NOT EXISTS public.portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_messages_no_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS portal_messages_sender_idx
  ON public.portal_messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_messages_recipient_idx
  ON public.portal_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_messages_pair_idx
  ON public.portal_messages (sender_id, recipient_id, created_at DESC);

-- Migrate legacy rows (student message + optional teacher reply as separate rows)
INSERT INTO public.portal_messages (id, sender_id, recipient_id, body_html, created_at)
SELECT id, student_id, teacher_id, body_html, created_at
FROM public.student_messages;

INSERT INTO public.portal_messages (sender_id, recipient_id, body_html, created_at)
SELECT teacher_id, student_id, reply_html, COALESCE(replied_at, created_at)
FROM public.student_messages
WHERE reply_html IS NOT NULL AND trim(reply_html) <> '';

ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_messages_select ON public.portal_messages;
CREATE POLICY portal_messages_select ON public.portal_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS portal_messages_insert_student ON public.portal_messages;
CREATE POLICY portal_messages_insert_student ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
  );

DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'admin')
  );

DROP POLICY IF EXISTS portal_messages_delete_student ON public.portal_messages;
CREATE POLICY portal_messages_delete_student ON public.portal_messages
  FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
    AND NOT EXISTS (
      SELECT 1 FROM public.portal_messages r
      WHERE r.sender_id = portal_messages.recipient_id
        AND r.recipient_id = portal_messages.sender_id
        AND r.created_at > portal_messages.created_at
    )
  );

DROP POLICY IF EXISTS student_messages_select ON public.student_messages;
DROP POLICY IF EXISTS student_messages_insert ON public.student_messages;
DROP POLICY IF EXISTS student_messages_teacher_update ON public.student_messages;
DROP POLICY IF EXISTS student_messages_student_delete ON public.student_messages;
DROP POLICY IF EXISTS student_messages_admin_all ON public.student_messages;

-- Must drop before student_messages: policy body references student_messages (005).
DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;

DROP TABLE IF EXISTS public.student_messages;

CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    AND EXISTS (SELECT 1 FROM public.profiles st WHERE st.id = profiles.id AND st.role = 'student')
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND profiles.role IN ('student', 'teacher', 'admin')
  );
