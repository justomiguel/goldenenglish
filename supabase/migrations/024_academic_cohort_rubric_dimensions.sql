-- Optional cohort-level rubric template: JSON array of dimensions.
-- enrollment_assessment_grades.rubric_data remains JSONB key-value (dimension key -> numeric score).

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS rubric_dimensions JSONB;

COMMENT ON COLUMN public.academic_cohorts.rubric_dimensions IS
  'Optional JSON array: [{ "key": "fluency", "label": "Fluidez", "scaleMin": 1, "scaleMax": 5 }, ...]. Keys must match rubric_data object keys.';
