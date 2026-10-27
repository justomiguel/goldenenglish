-- Staff opens of WhatsApp / mail / Gmail / Outlook from an admin message detail.
-- The row records the open. It does not mean the outside app delivered the text.

CREATE TABLE IF NOT EXISTS public.portal_message_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.portal_messages (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_message_follow_ups_channel_chk
    CHECK (channel IN ('whatsapp', 'mailto', 'gmail', 'outlook'))
);

CREATE INDEX IF NOT EXISTS portal_message_follow_ups_message_idx
  ON public.portal_message_follow_ups (message_id, created_at);

ALTER TABLE public.portal_message_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_message_follow_ups_admin_select ON public.portal_message_follow_ups;
CREATE POLICY portal_message_follow_ups_admin_select
  ON public.portal_message_follow_ups
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_message_follow_ups_admin_insert ON public.portal_message_follow_ups;
CREATE POLICY portal_message_follow_ups_admin_insert
  ON public.portal_message_follow_ups
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_admin(auth.uid())
  );

GRANT SELECT, INSERT ON public.portal_message_follow_ups TO authenticated, service_role;
