-- Proof that a family accepted the public privacy page on pre-inscription.
-- Admin-created leads stay NULL.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;

COMMENT ON COLUMN public.registrations.privacy_accepted_at IS
  'When the family accepted the public privacy page. Null for admin-created leads.';

COMMENT ON COLUMN public.registrations.privacy_policy_version IS
  'Version string of the privacy page the family accepted. Null for admin-created leads.';
