# ADR — Matriz de asistencia unificada (admin y profe usan el mismo componente)

- Estado: Aceptada
- Fecha: 2026-04
- Reglas relacionadas: `.cursor/rules/03-architecture.mdc`,
  `.cursor/rules/05-pwa-mobile-native.mdc`, `.cursor/rules/08-analytics-observability.mdc`,
  `.cursor/rules/10-engineering-governance.mdc`, `.cursor/rules/12-supabase-app-boundaries.mdc`.

## Contexto

Existían **tres** implementaciones paralelas de la matriz de asistencia de una sección,
con UX, modelos y reglas distintas:

1. **Admin** — `AdminSectionAttendanceMatrix` + `loadAdminSectionAttendanceMatrix`:
   ventana rolling de **28 días civiles**, sin saber del horario (`schedule_slots`),
   sin distinguir `cellEligibility`, sin auto-save por celda, sin “marcar columna”.
2. **Profe** — `SectionAttendanceBoard`: **formulario de un solo día**, lista de alumnos
   con radios (presente/ausente/tarde) y un botón “guardar”.
3. **Canónica** — `SectionAttendanceMatrix` (multi-día, schedule-aware, autosave por celda,
   bulk fill por columna, vista calendario y operacional/full course): **no se renderizaba
   en ninguna ruta** — código completo pero huérfano.

El usuario reportó que la vista de admin y la de profe “no se veían igual”, y el equipo
constató que las dos rutas existentes vivían en mundos distintos: capacidades, copy y
contratos contra `section_attendance` divergían.

Además, `useAttendanceMatrixAutosave` y `useSectionAttendanceMatrixBulk` ya importaban
acciones admin (`adminUpsertSectionAttendanceCellsAction`, `fillEmptyAdminAttendanceColumnAction`,
`undoAdminAttendanceColumnFillAction`) que **no existían** en
`adminSectionAttendanceActions.ts`: la integración admin del componente canónico ya
estaba contemplada en cliente, sin contraparte servidor.

## Decisión

Unificamos: **admin y profe ven el mismo componente**, `SectionAttendanceMatrix`,
con dos variantes de comportamiento controladas por `variant: "teacher" | "admin"`
y `cellEligibility: "enrollment" | "all"`:

- **Profe** (`/dashboard/teacher/sections/[id]/attendance/page.tsx`):
  - `variant="teacher"`, `cellEligibility="enrollment"`.
  - Matriz multi-día schedule-aware sobre el periodo de la sección.
  - Editable solo en clases ≤ hoy (calendario instituto), respetando RLS y la regla de
    elegibilidad por enrollment (`enrollmentEligibleForAttendanceOnDate`).
  - Reemplaza al `SectionAttendanceBoard` de un día (la confirmación del usuario fue
    explícita: “el profe pasa a tener SOLO la matriz multi-día (igual a admin)”).
- **Admin** (`/dashboard/admin/academic/[cohortId]/[id]/attendance/page.tsx`):
  - `variant="admin"`, `cellEligibility="all"`.
  - Mismo componente, mismo autosave, mismos atajos (P/A/T/E), bulk fill por columna,
    undo, vistas hoja/calendario.
  - Reglas backend más permisivas (validación contra periodo de la sección, sin filtro
    de elegibilidad por enrollment) en
    `src/lib/academics/adminAttendanceMatrixMutations.ts`.

Para que la integración admin del hook canónico tenga contraparte real, se añaden
las server actions admin que faltaban:

- `adminUpsertSectionAttendanceCellsAction`
- `fillEmptyAdminAttendanceColumnAction`
- `undoAdminAttendanceColumnFillAction`

Cada una `assertAdmin` + valida sección + delega en
`src/lib/academics/adminAttendanceMatrixMutations.ts` + `revalidatePath` + emite
evento `AnalyticsEntity.adminSectionAttendance` cuando aplica (regla `08`).

### Código eliminado (deuda técnica)

- `src/components/organisms/AdminSectionAttendanceMatrix.tsx`
- `src/components/organisms/SectionAttendanceBoard.tsx`
- `src/lib/academics/loadAdminSectionAttendanceMatrix.ts`
- `src/__tests__/lib/academics/loadAdminSectionAttendanceMatrix.test.ts`
- `src/app/[locale]/dashboard/teacher/sections/attendanceActions.ts`
  (`upsertAttendanceAction` solo lo usaba `SectionAttendanceBoard`, ya borrado).

### i18n

Bloque `dashboard.teacherSectionAttendance.matrix` completado en `en.json` y `es.json`
con todas las claves que consumen `SectionAttendanceMatrix` y sus hijas
(`gridAria`, `cellAria`, `cellDisabled*`, `keyboardHint*`, `editingPastDayBanner`,
`datesTruncated*`, `undo*`, `autosaveError`, `bulk*`, `columnFill*`, `viewTabsAria`,
`viewSheet`/`viewCalendar`, `calendarTitle`/`Hint`).

### Helper restaurado

`addUtcCalendarDaysIso` se restauró en `src/lib/academics/sectionAttendanceDateWindow.ts`
(ya se importaba/reexportaba pero no estaba definido, deuda preexistente que bloqueaba
TS estricto).

### Política de elegibilidad por enrollment

`enrollmentEligibleForAttendanceOnDate` ahora acepta `{ sectionStartsOn }`:
para `active` / `completed` el suelo se ensancha a
`min(section.starts_on, enrollment.created_at)` (cubre el caso de onboarding
mid-term en oficina). Para `transferred`/`dropped` se mantiene `created_at`
como suelo (esa fecha es el inicio real en *esta* sección).

## Alternativas consideradas

1. **Mantener tres implementaciones y solo armonizar copy.** Descartado: divergencia
   estructural (rolling 28 días vs schedule-aware vs un día) que el usuario percibe
   como bug y que duplica código de mutación, autosave y UX táctil.
2. **Hacer del board de un día la matriz oficial del profe.** Descartado: pierde la
   capacidad de corregir clases pasadas dentro del periodo (caso reportado por el
   usuario al inicio de esta línea de trabajo) y duplica trabajo en cliente para
   comportamientos que ya estaban resueltos en el componente canónico.
3. **Variante admin con componente separado pero misma “shell”.** Descartado: pequeñas
   diferencias (eligibility, atajo E para excused, scope) ya están parametrizadas en
   `SectionAttendanceMatrix` por `variant` y `cellEligibility`; un segundo componente
   sería duplicación pura.

## Consecuencias

Positivas:

- Una sola UX para admin y profe, una sola pila de hooks/server actions, mismo modelo
  de auto-save y de bulk fill.
- Permite corregir clases pasadas dentro del periodo (caso que originó esta línea de
  trabajo) tanto para profe (RLS + ventana app) como para admin (sin filtro de eligibility).
- Telemetría coherente: dos `AnalyticsEntity` (`section:teacher_attendance`,
  `section:admin_attendance`) con el mismo formato de metadata.

Riesgos / follow-ups:

- La página admin pierde la “caja” de columnas rolling 28 días que algunos perfiles
  podían recordar visualmente. Mitigación: la matriz canónica ofrece scope operacional
  + cambio a curso completo, con calendario lateral.
- Tests de smoke que enlazaban a `/admin/.../attendance` siguen apuntando a la nueva
  ruta (misma URL); tests específicos del board de un día se eliminaron junto al
  componente para no quedar como zombies.
- Las server actions admin (`upsertCells`, `fillColumn`, `undoColumn`) nuevas deberían
  recibir tests dedicados en una iteración siguiente (cubiertas indirectamente por las
  pruebas existentes del hook y por el smoke de la matriz canónica).
