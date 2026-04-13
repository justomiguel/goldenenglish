/** One criterion in a cohort rubric template (stored on academic_cohorts.rubric_dimensions). */
export type RubricDimensionDef = {
  key: string;
  label: string;
  scaleMin: number;
  scaleMax: number;
};
