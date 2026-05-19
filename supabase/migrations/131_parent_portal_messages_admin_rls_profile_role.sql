-- Parent → admin portal_messages INSERT failed when policies read profiles.role via
-- SELECT on public.profiles: parents cannot SELECT admin rows, so EXISTS(...) was false.
-- Use SECURITY DEFINER helpers (same pattern as 018_fix_profiles_rls_recursion.sql).

DROP POLICY IF EXISTS portal_messages_insert_parent ON public.portal_messages;
CREATE POLICY portal_messages_insert_parent ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND public.user_has_role(auth.uid(), 'parent')
    AND (
      public.parent_may_message_teacher(recipient_id)
      OR (
        public.profile_role(recipient_id) = 'admin'
        AND EXISTS (
          SELECT 1 FROM public.tutor_student_rel ts
          WHERE ts.tutor_id = auth.uid()
        )
      )
    )
  );
