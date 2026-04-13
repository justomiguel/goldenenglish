# ADR: Estructura académica (cohortes, secciones, inscripciones por sección)

## Contexto

El producto ya tiene `courses` + `enrollments` (nivel CEFR / año). Se añade un modelo paralelo **operativo** por cohorte y sección con horarios, profesor asignado, historial de inscripciones sin borrado físico y solicitudes de traslado profesor → admin.

## Decisión

- Tablas nuevas con prefijo **`academic_`** / pivote **`section_enrollments`** para no colisionar con `public.enrollments` existente.
- Estados de pivote: `active`, `completed`, `transferred`, `dropped`. Índice único parcial: a lo sumo **una** fila `active` por `(section_id, student_id)`.
- **Traslados**: `section_transfer_requests`; el profesor solo crea solicitudes; el admin aprueba y ejecuta el cambio de estado + nueva inscripción en transacción vía RPC `public.academic_admin_section_enroll_commit`.
- **Solapamiento de horarios**: validación duplicada en **SQL dentro del RPC** (fuente atómica) y helpers en **TypeScript** para preview/UI (`src/lib/academics/`) — el ADR asume que la lógica de solape debe mantenerse alineada al cambiar reglas.
- **Capacidad**: `academics.section.max_students` en `system.properties`; columna opcional `academic_sections.max_students` para override por sección.
- **Auditoría**: `recordSystemAudit` (`system_config_audit`) en cada commit admin que muta inscripción o aprueba traslado (payload acotado: ids, flags override).
- **Notificaciones**: email al padre vía `EmailProvider` + mensaje in-app (`portal_messages`) al alumno tras aprobación de traslado.

## Opciones descartadas

- **Reutilizar solo `enrollments` existente** — semántica distinta (curso vs sección con horario); alto riesgo de migración y queries rotas.
- **Solo validación en cliente** — incumple atomicidad y seguridad; el RPC valida de nuevo en servidor.

## Decisiones posteriores (abril 2026)

### `is_current` flag en cohortes

Se añade `academic_cohorts.is_current BOOLEAN DEFAULT false` con índice único parcial (`WHERE is_current = true`) para que haya **como máximo una** cohorte vigente. Reemplaza la inferencia por fecha `ends_on` como fuente de verdad. Helper: `loadCurrentCohort`, `loadCurrentCohortSections`.

Acción admin `setCurrentCohortAction` desactiva el flag anterior y lo activa en la nueva cohorte.

### Inscripción automática tras aceptar registro

`acceptRegistration` ahora retorna `{ ok: true, studentId }`. La UI muestra un **section picker inline** con `SectionCapacityBar` (secciones de la cohorte vigente) para que el admin inscriba al alumno sin salir del flujo.

### Asistencia: `section_attendance` como fuente única

El calendario del alumno ya lee `section_attendance` (estados: `present`, `absent`, `late`, `excused`) en lugar de la tabla legacy `attendance`. Estadísticas actualizadas: `late` cuenta como "asistido" para racha y porcentaje mensual.

### Deprecación de `section_grades`

Se depreca la calificación rápida (`section_grades`) en favor de `enrollment_assessment_grades` (rúbricas, publicación, email a padres). Vista de retención `v_section_enrollment_grade_average` migrada a leer solo grados publicados de assessments. Ruta `/grades` redirige permanentemente a `/assessments`.

### Copiar estructura de secciones entre cohortes

Desde la página de una cohorte destino, el admin puede copiar **solo** filas de `academic_sections` (nombre desambiguado si ya existe en destino, mismo `teacher_id`, `schedule_slots`, `max_students`). **No** se copian `section_enrollments`, asistencia ni calificaciones. Acción servidor: `copyCohortSectionStructureAction`; auditoría `academic_cohort_section_structure_copied`.

## Consecuencias

- Migración `017_academic_cohorts_sections.sql` + `026_cohort_is_current_and_cleanup.sql`.
- Tests en `src/__tests__/lib/academics/`, `src/__tests__/lib/attendance/`, `src/__tests__/attendance/`.
- Runbook: si se cambia el formato de `schedule_slots`, actualizar Zod + SQL de solape + ADR.
