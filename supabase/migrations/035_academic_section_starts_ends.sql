-- Operational window per section (within cohort, validated in app).

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS starts_on DATE,
  ADD COLUMN IF NOT EXISTS ends_on DATE;

UPDATE public.academic_sections s
SET
  starts_on = COALESCE(s.starts_on, c.starts_on, CURRENT_DATE),
  ends_on = COALESCE(
    s.ends_on,
    c.ends_on,
    COALESCE(s.starts_on, c.starts_on, CURRENT_DATE)
  )
FROM public.academic_cohorts c
WHERE s.cohort_id = c.id
  AND (s.starts_on IS NULL OR s.ends_on IS NULL);

UPDATE public.academic_sections
SET ends_on = starts_on
WHERE ends_on IS NULL;

UPDATE public.academic_sections
SET starts_on = ends_on
WHERE starts_on IS NULL;

ALTER TABLE public.academic_sections
  ALTER COLUMN starts_on SET NOT NULL,
  ALTER COLUMN ends_on SET NOT NULL;

ALTER TABLE public.academic_sections
  DROP CONSTRAINT IF EXISTS academic_sections_dates_order_chk;

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_dates_order_chk
  CHECK (starts_on <= ends_on);

COMMENT ON COLUMN public.academic_sections.starts_on IS
  'First day the section runs (calendar date; compare to cohort.starts_on/ends_on in app).';

COMMENT ON COLUMN public.academic_sections.ends_on IS
  'Last day the section runs (inclusive).';
