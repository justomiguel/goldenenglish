# ADR: Evitar recursión infinita en RLS de `academic_sections` (42P17)

## Contexto

La política `academic_sections_select_scope` (migraciones 018/019) permitía a un docente ver otras secciones del mismo cohort con:

`EXISTS (SELECT 1 FROM academic_sections mine WHERE mine.cohort_id = academic_sections.cohort_id …)`

Esa subconsulta volvía a evaluar RLS sobre `academic_sections` y reentraba en la misma política → **infinite recursion detected in policy** (`42P17`), p. ej. tras `INSERT` cuando el cliente hace `.select()` del registro creado.

## Decisión

Añadir función **`public.teacher_teaches_cohort(teacher_id, cohort_id)`** `SECURITY DEFINER` (mismo patrón que `user_has_role` en `017_fix_profiles_rls_recursion.sql`) para comprobar pertenencia a cohort sin reentrar en la política.

## Consecuencias

- Migración `027_academic_sections_rls_no_recursion.sql` — evita `EXISTS` sobre la misma tabla `academic_sections` en la política de `SELECT`.
- Migración `028_academic_sections_rls_break_enrollment_cycle.sql` — segundo ciclo **`academic_sections` ↔ `section_enrollments`**: la política de secciones consulta inscripciones y la de inscripciones volvía a consultar secciones con `EXISTS`. Se añade `section_teacher_id`; `teacher_teaches_cohort` (027) se reutiliza en `cohort_assessments_teacher_insert`; `section_teacher_id` sustituye el `EXISTS` en `section_enrollments_select_scope` y en `section_transfer_requests_teacher_insert`.
- `EXECUTE` concedido a `authenticated` en las funciones nuevas.
- Comportamiento de visibilidad equivalente a los `EXISTS` previos.
