-- Pay method for a pre-inscription before a section exists.
-- Additive. Existing rows stay NULL.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS enrollment_fee_paid_method TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_fee_paid_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS enrollment_fee_paid_on DATE;

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_fee_paid_method_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_fee_paid_method_check
  CHECK (
    enrollment_fee_paid_method IS NULL
    OR enrollment_fee_paid_method IN ('cash', 'transfer', 'card', 'gateway', 'other')
  );

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_fee_paid_amount_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_fee_paid_amount_check
  CHECK (enrollment_fee_paid_amount IS NULL OR enrollment_fee_paid_amount >= 0);

COMMENT ON COLUMN public.registrations.enrollment_fee_paid_method IS
  'How the matrícula was paid before a section exists: cash, transfer, card, gateway, or other.';
COMMENT ON COLUMN public.registrations.enrollment_fee_paid_on IS
  'Calendar date the institute received the matrícula.';
