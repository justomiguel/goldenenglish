-- Guardians may message admins (broadcast copies share broadcast_batch_id),
-- when they have at least one linked student via tutor_student_rel.

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'parent')
    AND (
      (
        EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'teacher')
        AND EXISTS (
          SELECT 1
          FROM public.tutor_student_rel ts
          JOIN public.profiles st ON st.id = ts.student_id
          WHERE ts.tutor_id = auth.uid()
            AND st.assigned_teacher_id = recipient_id
        )
      )
      OR (
        EXISTS (SELECT 1 FROM public.profiles r WHERE r.id = recipient_id AND r.role = 'admin')
        AND EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid()
        )
      )
    )
  );
