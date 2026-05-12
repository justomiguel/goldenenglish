-- Admins may delete portal_messages rows (inbox moderation / hygiene).

DROP POLICY IF EXISTS portal_messages_delete_admin ON public.portal_messages;
CREATE POLICY portal_messages_delete_admin ON public.portal_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
