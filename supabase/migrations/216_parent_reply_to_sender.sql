-- A parent may reply to an admin or teacher who already sent them a portal message.
-- A linked student is not required for this reply.
-- A new broadcast to every admin still requires tutor_student_rel (policy branch unchanged).

CREATE OR REPLACE FUNCTION public.parent_may_reply_to_sender(recipient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.user_has_role(auth.uid(), 'parent')
    AND public.profile_role(recipient_id) IN ('admin', 'teacher')
    AND EXISTS (
      SELECT 1
      FROM public.portal_messages m
      WHERE m.sender_id = recipient_id
        AND m.recipient_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.parent_may_reply_to_sender(uuid) IS
  'True when auth parent may portal-message recipient_id because that admin or teacher already wrote to the parent.';

REVOKE ALL ON FUNCTION public.parent_may_reply_to_sender(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.parent_may_reply_to_sender(uuid) TO authenticated;

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
      OR public.parent_may_reply_to_sender(recipient_id)
    )
  );
