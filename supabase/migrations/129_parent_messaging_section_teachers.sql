-- Parents may message teachers linked via assigned_teacher_id OR active section enrollment.

CREATE OR REPLACE FUNCTION public.parent_may_message_teacher(teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.user_has_role(auth.uid(), 'parent')
    AND public.profile_role(teacher_id) = 'teacher'
    AND (
      EXISTS (
        SELECT 1
        FROM public.tutor_student_rel ts
        WHERE ts.tutor_id = auth.uid()
          AND public.profile_assigned_teacher(ts.student_id) = teacher_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.tutor_student_rel ts
        INNER JOIN public.section_enrollments se
          ON se.student_id = ts.student_id
          AND se.status = 'active'
        INNER JOIN public.academic_sections sec
          ON sec.id = se.section_id
          AND sec.archived_at IS NULL
        WHERE ts.tutor_id = auth.uid()
          AND sec.teacher_id = teacher_id
      )
    );
$$;

COMMENT ON FUNCTION public.parent_may_message_teacher(uuid) IS
  'True when auth parent may portal-message teacher_id via linked student assigned_teacher_id or active section lead teacher.';

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'parent')
    AND (
      public.parent_may_message_teacher(recipient_id)
      OR (
        EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'admin')
        AND EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS profiles_select_teachers_assigned_to_tutored_students ON public.profiles;
CREATE POLICY profiles_select_teachers_assigned_to_tutored_students ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.user_has_role(auth.uid(), 'parent')
    AND profiles.role = 'teacher'
    AND public.parent_may_message_teacher(profiles.id)
  );
