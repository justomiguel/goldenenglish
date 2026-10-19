-- Allow the per-event copy of the registration-removed notice.

ALTER TABLE public.event_email_templates
  DROP CONSTRAINT IF EXISTS event_email_templates_key_chk;

ALTER TABLE public.event_email_templates
  ADD CONSTRAINT event_email_templates_key_chk CHECK (
    template_key IN (
      'events.registered',
      'events.payment_approved',
      'events.payment_rejected',
      'events.reminder',
      'events.registration_removed'
    )
  );
