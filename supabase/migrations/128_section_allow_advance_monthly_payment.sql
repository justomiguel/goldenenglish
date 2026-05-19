-- Per-section toggle: allow guardians/students to pay future months before they are due.
ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS allow_advance_monthly_payment boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.academic_sections.allow_advance_monthly_payment IS
  'When true, portal users may submit receipts or Flow checkout for months after the current calendar month.';
