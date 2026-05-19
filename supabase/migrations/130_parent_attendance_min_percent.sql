-- Parent portal: configurable minimum monthly attendance % (site default + per-section override).

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS min_attendance_percent smallint NULL;

ALTER TABLE public.academic_sections
  DROP CONSTRAINT IF EXISTS academic_sections_min_attendance_percent_range;

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_min_attendance_percent_range
  CHECK (
    min_attendance_percent IS NULL
    OR (min_attendance_percent >= 0 AND min_attendance_percent <= 100)
  );

COMMENT ON COLUMN public.academic_sections.min_attendance_percent IS
  'Optional override for parent attendance target (%). NULL inherits site default from academics_section_defaults.minAttendancePercent.';

UPDATE public.site_settings
SET value = value || '{"minAttendancePercent": 75}'::jsonb
WHERE key = 'academics_section_defaults'
  AND NOT (value ? 'minAttendancePercent');
