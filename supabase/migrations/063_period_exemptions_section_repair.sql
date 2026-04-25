-- Repair period exemptions created without section_id.
--
-- Finance section matrices only count section-scoped payments. The admin
-- period-exemption action briefly created legacy rows with section_id NULL;
-- when the student has exactly one active section, the intended section is
-- unambiguous and can be repaired safely.

WITH single_active_section AS (
  SELECT
    se.student_id,
    (array_agg(se.section_id ORDER BY se.section_id::text))[1] AS section_id,
    count(DISTINCT se.section_id) AS section_count
  FROM public.section_enrollments se
  WHERE se.status = 'active'
  GROUP BY se.student_id
)
UPDATE public.payments p
SET section_id = sas.section_id
FROM single_active_section sas
WHERE p.section_id IS NULL
  AND p.student_id = sas.student_id
  AND sas.section_count = 1
  AND p.status = 'exempt'
  AND NOT EXISTS (
    SELECT 1
    FROM public.payments scoped
    WHERE scoped.student_id = p.student_id
      AND scoped.section_id = sas.section_id
      AND scoped.month = p.month
      AND scoped.year = p.year
  );
