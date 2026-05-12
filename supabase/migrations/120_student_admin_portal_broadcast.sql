-- Students may message admins (broadcast copies share broadcast_batch_id).
-- Broadens INSERT and simplifies DELETE reply checks for teacher or admin recipients.

ALTER TABLE public.portal_messages
  ADD COLUMN IF NOT EXISTS broadcast_batch_id UUID NULL;

COMMENT ON COLUMN public.portal_messages.broadcast_batch_id IS
  'Logical group when one compose creates identical copies (e.g. student note to each admin inbox).';

DROP POLICY IF EXISTS portal_messages_insert_student ON public.portal_messages;
CREATE POLICY portal_messages_insert_student ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = recipient_id
        AND r.role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS portal_messages_delete_student ON public.portal_messages;
CREATE POLICY portal_messages_delete_student ON public.portal_messages
  FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.id = auth.uid() AND s.role = 'student')
    AND EXISTS (
      SELECT 1 FROM public.profiles r
      WHERE r.id = portal_messages.recipient_id
        AND r.role IN ('teacher', 'admin')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.portal_messages reply
      WHERE reply.recipient_id = portal_messages.sender_id
        AND EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = reply.sender_id AND p.role IN ('teacher', 'admin')
        )
        AND reply.created_at > portal_messages.created_at
    )
  );
