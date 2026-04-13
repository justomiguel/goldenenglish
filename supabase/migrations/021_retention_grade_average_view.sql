-- Aggregated section grades per enrollment (admin retention / reports).
-- security_invoker: RLS on underlying section_grades applies to invoker.

CREATE OR REPLACE VIEW public.v_section_enrollment_grade_average
WITH (security_invoker = true) AS
SELECT
  enrollment_id,
  ROUND(AVG(score)::numeric, 2) AS avg_score,
  COUNT(*)::bigint AS grade_count
FROM public.section_grades
GROUP BY enrollment_id;

COMMENT ON VIEW public.v_section_enrollment_grade_average IS
  'Mean score per section enrollment for retention dashboards; RLS from section_grades.';
