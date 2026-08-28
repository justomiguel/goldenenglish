-- Live matrícula / cuota defaults on the cohort. Section NULL enrollment
-- inherits the cohort default; stored 0 stays "this section does not charge".
-- Existing section rows are not rewritten.

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS default_enrollment_fee_amount NUMERIC(12, 2) NULL;

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS default_monthly_fee NUMERIC(12, 2) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academic_cohorts_default_enrollment_fee_nonneg'
  ) THEN
    ALTER TABLE public.academic_cohorts
      ADD CONSTRAINT academic_cohorts_default_enrollment_fee_nonneg
      CHECK (
        default_enrollment_fee_amount IS NULL
        OR default_enrollment_fee_amount >= 0
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academic_cohorts_default_monthly_fee_nonneg'
  ) THEN
    ALTER TABLE public.academic_cohorts
      ADD CONSTRAINT academic_cohorts_default_monthly_fee_nonneg
      CHECK (default_monthly_fee IS NULL OR default_monthly_fee >= 0);
  END IF;
END $$;

ALTER TABLE public.academic_sections
  ALTER COLUMN enrollment_fee_amount DROP NOT NULL;

ALTER TABLE public.academic_sections
  ALTER COLUMN enrollment_fee_amount SET DEFAULT NULL;

ALTER TABLE public.academic_sections
  DROP CONSTRAINT IF EXISTS academic_sections_enrollment_fee_nonneg;

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_enrollment_fee_nonneg
  CHECK (enrollment_fee_amount IS NULL OR enrollment_fee_amount >= 0);

COMMENT ON COLUMN public.academic_cohorts.default_enrollment_fee_amount IS
  'Optional live default matrícula for sections with enrollment_fee_amount NULL.';

COMMENT ON COLUMN public.academic_cohorts.default_monthly_fee IS
  'Optional live default monthly fee when the section has no effective fee plan.';

COMMENT ON COLUMN public.academic_sections.enrollment_fee_amount IS
  'Section matrícula. NULL inherits the cohort default (or 0 if none). 0 = this section does not charge. Currency is the effective monthly plan currency.';
