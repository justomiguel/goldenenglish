-- How student/parent-facing monthly dues are computed for this section
-- (`operational-window` in app): prorate by class count vs charge full monthly plan fee.

ALTER TABLE public.academic_sections
ADD COLUMN IF NOT EXISTS monthly_fee_charge_mode text NOT NULL DEFAULT 'prorate_by_classes';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'academic_sections_monthly_fee_charge_mode_chk'
  ) THEN
    ALTER TABLE public.academic_sections
      ADD CONSTRAINT academic_sections_monthly_fee_charge_mode_chk
      CHECK (monthly_fee_charge_mode IN ('prorate_by_classes', 'full_month_fee'));
  END IF;
END $$;

COMMENT ON COLUMN public.academic_sections.monthly_fee_charge_mode IS
  'Monthly tuition basis for alumno/tutor dashboards and Flow/receipt flows: '
  'prorate_by_classes = proportional to classes in period; '
  'full_month_fee = full plan month fee whenever the student is in-period for that month. '
  'Admin Cobranzas plan-year matrices are unchanged by this flag.';
