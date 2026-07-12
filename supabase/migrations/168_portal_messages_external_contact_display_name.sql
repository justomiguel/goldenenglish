-- Persist visitor display name for public contact form portal rows (list From column).
-- Additive only; legacy rows keep NULL and fall back to HTML meta extract in app code.

ALTER TABLE public.portal_messages
  ADD COLUMN IF NOT EXISTS external_contact_display_name TEXT NULL;

COMMENT ON COLUMN public.portal_messages.external_contact_display_name IS
  'Visitor full name from the public contact form; shown in admin inbox instead of the synthetic site_contact profile.';

-- Keep updates limited to attention columns; display name is immutable after insert (like reply email).
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
     OR NEW.external_contact_display_name IS DISTINCT FROM OLD.external_contact_display_name
  THEN
    RAISE EXCEPTION 'portal_messages update limited to attention columns';
  END IF;
  RETURN NEW;
END;
$$;
