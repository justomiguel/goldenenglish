-- Portal messaging rules:
-- parent → teacher (linked ward has assigned_teacher_id = recipient)
-- student → teacher (unchanged)
-- teacher → student | parent | teacher | admin
-- admin → student | parent | teacher | admin
-- Teachers can load parent profiles for compose + threads.

DROP POLICY IF EXISTS portal_messages_insert_teacher ON public.portal_messages;
CREATE POLICY portal_messages_insert_teacher ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = recipient_id
        AND r.role IN ('student', 'parent', 'teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS portal_messages_insert_admin ON public.portal_messages;
CREATE POLICY portal_messages_insert_admin ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = recipient_id
        AND r.role IN ('student', 'parent', 'teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'parent')
    AND EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      JOIN public.profiles st ON st.id = ts.student_id
      WHERE ts.tutor_id = auth.uid()
        AND st.assigned_teacher_id = recipient_id
    )
  );

DROP POLICY IF EXISTS profiles_select_teacher_for_messaging ON public.profiles;
CREATE POLICY profiles_select_teacher_for_messaging ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'teacher')
    AND profiles.role IN ('student', 'parent', 'teacher', 'admin')
  );

DROP POLICY IF EXISTS profiles_select_teacher_via_messages ON public.profiles;
CREATE POLICY profiles_select_teacher_via_messages ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.profiles peer
      WHERE peer.id = profiles.id AND peer.role IN ('student', 'parent')
    )
    AND EXISTS (
      SELECT 1 FROM public.portal_messages m
      WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
         OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS profiles_select_teachers_assigned_to_tutored_students ON public.profiles;
CREATE POLICY profiles_select_teachers_assigned_to_tutored_students ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent')
    AND profiles.role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      JOIN public.profiles st ON st.id = ts.student_id
      WHERE ts.tutor_id = auth.uid()
        AND st.assigned_teacher_id = profiles.id
    )
  );
