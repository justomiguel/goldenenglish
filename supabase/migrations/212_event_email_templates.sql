-- Per-event email copies. Confirmation mails may also vary by registration flow.

CREATE TABLE IF NOT EXISTS public.event_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  flow_id UUID REFERENCES public.event_registration_flows (id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  locale TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT event_email_templates_key_chk CHECK (
    template_key IN (
      'events.registered',
      'events.payment_approved',
      'events.payment_rejected',
      'events.reminder'
    )
  ),
  CONSTRAINT event_email_templates_locale_chk CHECK (locale IN ('es', 'en', 'pt')),
  CONSTRAINT event_email_templates_subject_chk CHECK (length(trim(subject)) > 0),
  CONSTRAINT event_email_templates_body_chk CHECK (length(trim(body_html)) > 0),
  CONSTRAINT event_email_templates_flow_scope_chk CHECK (
    flow_id IS NULL
    OR template_key IN ('events.registered', 'events.payment_approved')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS event_email_templates_scope_uidx
  ON public.event_email_templates (event_id, flow_id, template_key, locale)
  NULLS NOT DISTINCT;

ALTER TABLE public.event_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_email_templates_admin_all ON public.event_email_templates;
CREATE POLICY event_email_templates_admin_all
  ON public.event_email_templates
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS registration_locale TEXT NOT NULL DEFAULT 'es';

ALTER TABLE public.event_attendees
  DROP CONSTRAINT IF EXISTS event_attendees_registration_locale_chk;

ALTER TABLE public.event_attendees
  ADD CONSTRAINT event_attendees_registration_locale_chk
  CHECK (registration_locale IN ('es', 'en', 'pt'));
