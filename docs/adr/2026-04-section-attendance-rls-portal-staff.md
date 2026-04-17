# ADR: RLS de asistencia alineada al portal docente

## Contexto

Las políticas `section_attendance_teacher_*` (post-022) exigían `user_has_role(auth.uid(), 'teacher')`. La aplicación ya permite registrar asistencia a quien pasa `resolveTeacherPortalAccess` y `userIsSectionTeacherOrAssistant`, incluyendo rol de perfil **`assistant`** y alumnos con fila en **`academic_section_assistants`**. La función **`section_enrollment_teacher_is_self`** ya acota por sección (titular o ayudante).

## Decisión

En INSERT/UPDATE/DELETE de `section_attendance` para el camino no-admin, **eliminar** la condición `user_has_role(..., 'teacher')` y basar el permiso en `section_enrollment_teacher_is_self(enrollment_id)` más la ventana operativa de fechas y `recorded_by = auth.uid()` donde aplica.

## Consecuencias

- Staff `assistant` y ayudantes alumno pueden persistir asistencia como en las server actions.
- El alcance sigue acotado a enrollments de secciones donde el usuario es titular o ayudante registrado.
- Migración: `044_section_attendance_rls_portal_staff.sql`.

## Actualización (ventana de fechas docente)

La ventana “últimos 2 días + hoy” en RLS (`CURRENT_DATE`) impedía corregir asistencias más atrás y no coincidía con el calendario del instituto. Se amplía el permiso de escritura (no-admin) a fechas `attended_on` entre **hoy en `America/Argentina/Cordoba`** (misma zona que analíticas / `getInstituteTimeZone`) y hasta **4000 días** (~11 años) hacia atrás, sin permitir fechas futuras. App: `isTeacherAttendanceDateAllowedForSection` y columnas de matriz hasta `ends_on` (futuro visible, solo lectura hasta ese día). Migración: `045_section_attendance_teacher_institute_window.sql`.
