# ADR: Ayudantes de sección y cambio de titular

## Contexto

Las secciones tenían un único `teacher_id` sin UI admin para reasignarlo. Se necesitaban **ayudantes** con acceso operativo al portal del profesor (lista, asistencia, notas, traslados) sin ser el titular en base de datos, incluyendo alumnos con cuenta y personal con rol dedicado.

## Decisión

1. **`teacher_id`** sigue siendo el **profesor titular** (único por sección).
2. Tabla **`academic_section_assistants`** `(section_id, assistant_id)` con PK compuesta; perfiles con `role` ∈ {`teacher`, `student`, `assistant`}; el titular no puede figurar como ayudante (filtrado en servidor). Para **alumnos**, el servidor valida que el horario de la sección asistida no se solape con sus otras matrículas activas (`previewStudentAssistantScheduleConflicts`).
3. Rol global **`assistant`** en el enum `user_role` (Postgres) para cuentas staff sin aula titular; `academics.teacherPortal.allowedProfileRoles` incluye `teacher,assistant`. Los alumnos ayudantes conservan `role = student` y entran al portal de secciones si tienen fila en `academic_section_assistants` (`resolveTeacherPortalAccess`).
4. **Ayudantes externos** sin login: tabla **`academic_section_external_assistants`** (`section_id`, `display_name`); sin validación de horario en producto (no hay matrículas).
5. **RLS**: función `user_leads_or_assists_section`; políticas de `academic_sections`, `section_enrollments`, `section_transfer_requests` (insert solo exige liderar o asistir la sección de origen, no rol `teacher`) y `section_enrollment_teacher_is_self` (SECURITY DEFINER) para incluir ayudantes.
6. **`teacher_teaches_cohort`** incluye secciones donde el usuario es ayudante (cohortes visibles para pares).
7. **Admin**: editor en la ficha de sección (`AcademicSectionStaffEditor` + bloques) — titular, ayudantes con perfil y ayudantes externos con acciones y auditoría separadas.

## Alternativas descartadas

- **Solo JSON de IDs en la sección**: peor integridad referencial y políticas RLS más frágiles.
- **Varios titulares sin rol único**: rompe informes y FKs existentes ligadas a `teacher_id`.

## Consecuencias

- Migraciones **`035_academic_section_assistants_and_staff.sql`** y **`036_user_role_assistant_external_section_assistants.sql`** en cada entorno.
- Copiar estructura de cohorte copia también filas de ayudantes con perfil y externos.
- Listados del profesor usan `loadTeacherSectionIdsForUser` + `chunkedIn` para acotar `.in()` (regla 13).
