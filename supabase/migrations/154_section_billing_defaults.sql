-- Product default: sections allow advance monthly payments and charge the full
-- plan month fee (not prorated by class count). Applies to new rows and
-- backfills existing sections that still carry the prior defaults.

ALTER TABLE public.academic_sections
  ALTER COLUMN allow_advance_monthly_payment SET DEFAULT true;

UPDATE public.academic_sections
  SET allow_advance_monthly_payment = true
  WHERE allow_advance_monthly_payment IS DISTINCT FROM true;

ALTER TABLE public.academic_sections
  ALTER COLUMN monthly_fee_charge_mode SET DEFAULT 'full_month_fee';

UPDATE public.academic_sections
  SET monthly_fee_charge_mode = 'full_month_fee'
  WHERE monthly_fee_charge_mode IS DISTINCT FROM 'full_month_fee';
