-- Visitor email for website contact portal rows (sender = site_contact profile).
-- Enables admins to reply by outbound email without messaging that synthetic profile.

ALTER TABLE public.portal_messages
  ADD COLUMN IF NOT EXISTS external_contact_reply_email TEXT NULL;

COMMENT ON COLUMN public.portal_messages.external_contact_reply_email IS
  'Email supplied with public-site contact submissions; used when admins reply by mail (visitor has no portal account).';
