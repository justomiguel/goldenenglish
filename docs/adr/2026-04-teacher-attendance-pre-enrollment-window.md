# ADR: Ventana de asistencia del docente desde el inicio de la sección, no desde el alta del alumno

## Contexto

El portal docente expone una matriz de asistencia para una sección. Una celda
`(alumno, día de clase)` sólo se puebla en `loadTeacherSectionAttendanceMatrix`
si `enrollmentEligibleForAttendanceOnDate(day, enrollment)` devuelve `true`.
Hasta este cambio esa función usaba como **piso** únicamente el
`section_enrollments.created_at` del alumno: si el registro de enrollment se
creó después de un día de clase, esa celda se renderizaba como un cuadrado
gris **no navegable** y el docente no podía registrar asistencia.

En la práctica los alumnos suelen darse de alta administrativamente **después**
de que la sección ya está corriendo (alta tardía, migración, onboarding mid-term).
La consecuencia operativa era que el docente no podía registrar asistencias
pasadas válidas para alumnos `active`/`completed`, a pesar de que el portal
admin sí podía hacerlo (`loadAdminSectionAttendanceMatrix` invoca al loader con
`cellEligibility: "all"` y se saltea el filtro). Resultaba en flujo bloqueado y
sin explicación visible para el docente.

## Decisión

Para enrollments con `status` **`active`** o **`completed`** el piso pasa a ser
`min(section.starts_on, enrollment.created_at)`. El docente puede registrar
asistencia desde el inicio real de la sección aunque el registro de enrollment
del alumno se haya creado después.

Para enrollments con `status` **`transferred`** o **`dropped`** el piso queda
en `enrollment.created_at` (la fecha real de incorporación a esta sección es la
transferencia o el alta y `updated_at` sigue siendo el techo). No corresponde
abrir asistencia previa a esa fecha en esta sección.

Cuando la celda no es elegible para ese alumno en esa fecha el componente
`TeacherAttendanceMatrixTable` ahora renderiza un botón **disabled** con
`title` y `data-att-disabled-reason="not_enrolled_on_date"` y la copy
`dict.cellDisabledNotEnrolledOnDate` (i18n), en lugar del cuadrado mudo
anterior, para que el docente entienda por qué no puede marcar.

La regla se aplica simétricamente en:

- `enrollmentEligibleForAttendanceOnDate(..., { sectionStartsOn })` —
  `src/lib/academics/sectionEnrollmentEligibleOnDate.ts`.
- Loader del matrix —
  `src/lib/dashboard/loadTeacherSectionAttendanceMatrix.ts` (acepta y propaga
  `sectionStartsOn`).
- Backend de upsert / column fill —
  `src/lib/academics/teacherAttendanceMatrixMutations.ts` y
  `src/app/[locale]/dashboard/teacher/sections/attendanceActions.ts`,
  para que el server nunca rechace lo que la UI muestra como editable.
- UI —
  `src/components/organisms/TeacherAttendanceMatrixTable.tsx` (botón disabled
  + tooltip, en lugar de placeholder no navegable).

Las políticas RLS de `section_attendance` ya validaban únicamente la ventana
de fechas sobre `attended_on` (`045_section_attendance_teacher_institute_window.sql`)
y no chequean `created_at` del enrollment, por lo que **no requieren cambio**.

## Opciones consideradas

1. **Aplicar el piso `min(starts_on, created_at)` solo para `active`/`completed`**
   *(elegida)*. Refleja la realidad operativa del instituto sin abrir
   asistencia pre-transferencia para alumnos que llegaron por traspaso.
2. **Mantener `created_at` como piso y obligar al admin a corregir asistencias previas**.
   Descartada: rompe el flujo del docente y no escala a institutos con onboarding tardío.
3. **Permitir al docente marcar todo como hace admin (`cellEligibility: "all"`)**.
   Descartada: pierde la guarda de no marcar asistencia para un alumno transferido o dado
   de baja en fechas que no aplican a esta sección.

## Consecuencias

Positivas:

- El docente puede registrar y corregir asistencias pasadas válidas para alumnos
  `active`/`completed` desde el inicio de la sección.
- Tooltips explican por qué una celda está bloqueada
  (`cellDisabledNotEnrolledOnDate`, `cellDisabledFuture`, `cellDisabledPast`,
  `cellDisabledExcused`, `cellDisabledInactive`).
- Cliente y servidor coinciden: lo que el matrix muestra como editable, el server lo acepta.

Riesgos:

- Si un instituto usa `created_at` como reflejo intencional de "incorporación
  efectiva" para alumnos `active`, ahora el docente podrá marcar fechas previas
  a esa incorporación. Es coherente con la práctica observada y con lo que
  admin ya hacía.

Follow-ups:

- Tests añadidos:
  - `src/__tests__/lib/academics/sectionEnrollmentEligibleOnDate.test.ts` (helper).
  - `src/__tests__/lib/dashboard/loadTeacherSectionAttendanceMatrixSectionStart.test.ts` (loader).
  - `src/__tests__/lib/academics/teacherAttendanceMatrixMutationsSectionStart.test.ts` (backend).
  - `src/__tests__/components/TeacherAttendanceMatrixDisabledTooltip.test.tsx` (UI).
- i18n: nueva clave `cellDisabledNotEnrolledOnDate` en `en.json` y `es.json`.
