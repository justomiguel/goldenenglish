-- Operational defaults previously sourced from `system.properties` on disk.
-- Moves them to `public.site_settings` so each tenant can override them via
-- the re-entrant site setup wizard or the existing admin Settings surface,
-- without relying on a checked-in file at the repo root.
--
-- Aditiva e idempotente: `ON CONFLICT (key) DO NOTHING` preserva cualquier
-- valor preexistente (no destruye datos — ver regla
-- `.cursor/rules/21-migrations-production-no-data-destruction.mdc`). Los
-- valores insertados son **idénticos** a los defaults Golden para que los
-- tenants no perciban un cambio funcional tras desplegar esta migración.

INSERT INTO public.site_settings (key, value) VALUES
  ('legal_age_majority',           '{"value":18}'::jsonb),
  ('student_renewal_warn_days',    '{"value":300}'::jsonb),
  (
    'billing_terms',
    '{
      "enrollment":{"es":"Matrícula","en":"Enrollment fee"},
      "monthly":{"es":"Mensualidad","en":"Monthly fee"},
      "promotion":{"es":"Promoción","en":"Promotion"}
    }'::jsonb
  ),
  (
    'academics_section_defaults',
    '{
      "maxStudents":60,
      "teacherPortalRoles":["teacher","assistant"]
    }'::jsonb
  ),
  (
    'academics_attendance_matrix',
    '{
      "teacher":{
        "scanLookbackBufferDays":7,
        "operationalCivilLookbackDays":14,
        "operationalMaxClassDays":28,
        "fullCourseMaxClassDays":156
      },
      "admin":{
        "fallbackLookbackDays":400,
        "maxClassDays":520
      },
      "pickAdjacentCivilDays":14,
      "hasEligibleWindowMaxScans":400
    }'::jsonb
  ),
  (
    'analytics_config',
    '{
      "namespace":"goldenenglish",
      "version":"1",
      "timezone":"America/Argentina/Cordoba"
    }'::jsonb
  )
ON CONFLICT (key) DO NOTHING;
