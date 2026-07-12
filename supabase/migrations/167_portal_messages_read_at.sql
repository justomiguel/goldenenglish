-- Admin inbox attention: per-row read marker + external site-contact reply marker.
-- Additive only; existing rows remain unread / unreplied (NULL).

ALTER TABLE public.portal_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.portal_messages
  ADD COLUMN IF NOT EXISTS external_replied_at TIMESTAMPTZ;

COMMENT ON COLUMN public.portal_messages.read_at IS
  'When the recipient (admin copy) opened or answered this inbox row.';

COMMENT ON COLUMN public.portal_messages.external_replied_at IS
  'When staff sent an email reply to a website contact submission (shared across broadcast batch).';

CREATE INDEX IF NOT EXISTS portal_messages_recipient_unread_idx
  ON public.portal_messages (recipient_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.portal_messages_attention_columns_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.body_html IS DISTINCT FROM OLD.body_html
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.broadcast_batch_id IS DISTINCT FROM OLD.broadcast_batch_id
     OR NEW.external_contact_reply_email IS DISTINCT FROM OLD.external_contact_reply_email
  THEN
    RAISE EXCEPTION 'portal_messages update limited to attention columns';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portal_messages_attention_columns_only_trg ON public.portal_messages;
CREATE TRIGGER portal_messages_attention_columns_only_trg
  BEFORE UPDATE ON public.portal_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.portal_messages_attention_columns_only();

DROP POLICY IF EXISTS portal_messages_update_attention ON public.portal_messages;
CREATE POLICY portal_messages_update_attention ON public.portal_messages
  FOR UPDATE TO authenticated
  USING (
    recipient_id = auth.uid()
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    recipient_id = auth.uid()
    OR public.is_admin(auth.uid())
  );
