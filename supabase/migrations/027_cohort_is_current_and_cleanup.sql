-- Phase 1: explicit is_current flag on cohorts + retention view migration.

-- 1. is_current on academic_cohorts (at most one true at a time)
ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS academic_cohorts_one_current
  ON public.academic_cohorts (is_current) WHERE is_current = true;

-- Helper: returns the current cohort id or NULL.
CREATE OR REPLACE FUNCTION public.get_current_cohort_id()
RETURNS UUID
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT id FROM public.academic_cohorts WHERE is_current = true LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_cohort_id() TO authenticated;

-- 2. Retention view: switch from section_grades to enrollment_assessment_grades (published only).
CREATE OR REPLACE VIEW public.v_section_enrollment_grade_average
WITH (security_invoker = true) AS
SELECT
  enrollment_id,
  ROUND(AVG(score)::numeric, 2) AS avg_score,
  COUNT(*)::bigint AS grade_count
FROM public.enrollment_assessment_grades
WHERE status = 'published'
GROUP BY enrollment_id;

COMMENT ON VIEW public.v_section_enrollment_grade_average IS
  'Mean published assessment score per section enrollment for retention dashboards.';
