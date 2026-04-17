# ADR: Admins as section staff (lead teacher and assistants)

**Date:** 2026-04-17
**Status:** Accepted

## Context

En Golden English los **admin** del instituto históricamente cubren cursos como
docentes titulares o como asistentes (especialmente en cohortes con bajas o
suplencias). El backend admite esto: `academic_sections.teacher_id` y
`academic_section_assistants.assistant_id` son sólo FKs a `profiles(id)` y la
tabla no exige `role = 'teacher'`. El acceso al portal docente
(`resolveTeacherPortalAccess`) ya contempla explícitamente "admin who teaches".

Sin embargo, las server actions del portal admin que **asignan** staff a una
sección filtraban duro por `role = 'teacher'`:

- `updateAcademicSectionTeacherAction` (cambio de titular) hacía
  `select(...).eq("role","teacher").maybeSingle()` y descartaba a cualquier admin.
- `createAcademicSectionAction` (alta de sección) replicaba el mismo filtro.
- `replaceAcademicSectionAssistantsAction` validaba contra
  `PROFILE_ASSISTANT_ROLES = {"teacher","student","assistant"}` (sin `admin`).
- Las pick-lists del admin (`loadAdminSectionTeachersAndAssistants` y la página
  `/dashboard/admin/academic/[cohortId]`) listaban `profiles` con
  `eq("role","teacher")`, así que el admin ni aparecía como candidato.

Resultado: en producción el admin no podía asignarse (ni asignar a otro admin)
como docente o asistente de una sección, contradiciendo la regla de negocio
documentada y el comportamiento del portal docente.

Esta regla impacta **autorización visible** (quién puede asignarse a una
sección) y un **contrato compartido** (server actions consumidas desde admin
desktop y admin PWA), por lo que entra en el alcance de
`.cursor/rules/10-engineering-governance.mdc` y se documenta en este ADR.

## Decision

1. Centralizar la regla en `src/lib/academics/sectionStaffEligibleRoles.ts`:
   - `SECTION_LEAD_TEACHER_ELIGIBLE_ROLES = ["teacher", "admin"]`
   - `SECTION_ASSISTANT_ELIGIBLE_ROLES = ["teacher", "assistant", "student", "admin"]`
   - Helpers `isProfileEligibleAsSectionLeadTeacher` /
     `isProfileEligibleAsSectionAssistant` para uso simétrico en validaciones.
2. Usar el helper en **todas** las superficies que validan o listan staff:
   - `createAcademicSectionAction` y `updateAcademicSectionTeacherAction`
     validan el titular contra `SECTION_LEAD_TEACHER_ELIGIBLE_ROLES`.
   - `replaceAcademicSectionAssistantsAction` valida cada asistente contra
     `SECTION_ASSISTANT_ELIGIBLE_ROLES`.
   - `loadAdminSectionTeachersAndAssistants` y la página
     `/dashboard/admin/academic/[cohortId]` listan candidatos con
     `in("role", SECTION_LEAD_TEACHER_ELIGIBLE_ROLES)`.
3. No tocar el portal docente ni la RLS: el acceso ya estaba bien (los admin
   pasan por `resolveIsAdminSession` o por su fila en `teacher_id`/assistants).

## Options considered

- **A) Sólo agregar `"admin"` en cada `eq` y en `PROFILE_ASSISTANT_ROLES`.**
  Rechazada: replica la cadena `role === 'teacher'` en cinco sitios y
  contradice `foundation-rules.mdc` ("evitar lógica frágil del estilo
  `role === 'teacher'` repartida en muchos sitios sin helpers").
- **B) Hacer la regla configurable vía `system.properties`** (algo como
  `academics.sectionStaff.leadEligibleRoles`).
  Rechazada por ahora: el conjunto `{teacher, admin}` es estructural del
  modelo de roles del producto y no lo configura el cliente; promover a
  properties añade una superficie sin caso de uso real. Si en el futuro
  aparece una variante por instituto, se promueve siguiendo el patrón ya usado
  en `getTeacherPortalAllowedRoles` sin cambiar las callsites.
- **C) Single source elegida** (la implementada): un módulo puro en
  `src/lib/academics/` con constantes + predicados, importado tanto por
  validación como por loaders/pick-lists.

## Consequences

- Los admin pueden ahora ser asignados como titular o como asistente desde el
  portal admin sin tocar SQL, y aparecen en los selectores correspondientes.
- Una sola fuente para la regla "quién puede ser staff de una sección":
  futuras superficies (PWA admin, jobs, importadores) usan el helper.
- Tests:
  - `src/__tests__/lib/academics/sectionStaffEligibleRoles.test.ts` fija
    el contrato del helper.
  - `src/__tests__/app/sectionStaffActions.test.ts` cubre admin como titular
    y como asistente, y mantiene el rechazo de roles fuera del staff.
  - `src/__tests__/app/academicSectionActions.test.ts` cubre admin como
    titular en `createAcademicSectionAction` y rechazo de roles inválidos.
  - `src/__tests__/lib/academics/loadAdminSectionTeachersAndAssistants.test.ts`
    fija que el pick-list pide `role IN [teacher, admin]`.
- Observabilidad: los `recordSystemAudit` existentes
  (`academic_section_teacher_updated`,
  `academic_section_assistants_replaced`, `academic_section_created`) ya
  capturan el ID del nuevo titular/asistentes; el rol del actor (admin) no se
  duplica en payload porque ya queda en `system_config_audit.actor_id`.
- RLS / migraciones: sin cambios. El esquema ya permitía estos profiles en
  `teacher_id` / `assistant_id`.

## References

- `src/lib/academics/sectionStaffEligibleRoles.ts`
- `src/app/[locale]/dashboard/admin/academic/sectionStaffActions.ts`
- `src/app/[locale]/dashboard/admin/academic/sectionActions.ts`
- `src/lib/academics/loadAdminSectionTeachersAndAssistants.ts`
- `src/app/[locale]/dashboard/admin/academic/[cohortId]/page.tsx`
- `src/lib/academics/resolveTeacherPortalAccess.ts` (acceso, no asignación)
- `.cursor/rules/foundation-rules.mdc` (helpers centralizados de rol)
- `.cursor/rules/10-engineering-governance.mdc` (alcance del ADR)
