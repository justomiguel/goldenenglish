-- Per-section feature flags: evaluations-to-pass and learning-route workspace.
-- Defaults false (opt-in). Admin Configuration toggles control tab visibility and progress rules.

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS requires_evaluations_to_pass boolean NOT NULL DEFAULT false;

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS uses_learning_route boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.academic_sections.requires_evaluations_to_pass IS
  'When true, section shows Assessments tab and evaluation-based pass/progress rules apply.';

COMMENT ON COLUMN public.academic_sections.uses_learning_route IS
  'When true, section shows Learning route tab and route/free-flow progress applies to learners.';
