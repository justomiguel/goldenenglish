-- Per-event registration question order and optional required flags.
-- Empty registration_field_order keeps the legacy layout (base fields, then extras).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS require_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_birth_date BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_field_order TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.require_phone IS
  'When true, a new registration must include a phone number.';

COMMENT ON COLUMN public.events.require_birth_date IS
  'When true and collect_birth_date is on, a new registration must include a birth date.';

COMMENT ON COLUMN public.events.registration_field_order IS
  'Tokens base:<id> and field:<uuid>. Empty means the legacy question order.';
