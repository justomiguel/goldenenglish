/**
 * Single source of truth for "who can be section staff" in this institute.
 *
 * Reglas del producto (`AGENTS.md` / foundation-rules: roles centralizados, evitar
 * `role === 'teacher'` repartido):
 * - Un **admin** del instituto puede dar clases o asistir clases. La asignación de
 *   docente o asistente de una sección NO debe filtrar `admin` por fuera.
 * - Un **assistant** dedicado puede ser asistente de clase pero no titular.
 * - Un **student** puede ser asistente puntual (alumno avanzado), no titular.
 * - Cualquier otro rol está fuera del staff de aula.
 *
 * Esta lista se aplica simétricamente en:
 *   - validación del titular en `createAcademicSectionAction` y
 *     `updateAcademicSectionTeacherAction` (`src/app/[locale]/dashboard/admin/academic/...`)
 *   - validación del set de asistentes en `replaceAcademicSectionAssistantsAction`
 *   - pick-lists del admin (`loadAdminSectionTeachersAndAssistants`,
 *     `admin/academic/[cohortId]/page.tsx`)
 *
 * El acceso al portal docente al renderizar (no la asignación) se resuelve aparte en
 * `resolveTeacherPortalAccess` y por las filas en `academic_sections.teacher_id` y
 * `academic_section_assistants` — el admin queda cubierto allí también.
 */

export const SECTION_LEAD_TEACHER_ELIGIBLE_ROLES = ["teacher", "admin"] as const;
export type SectionLeadTeacherEligibleRole = (typeof SECTION_LEAD_TEACHER_ELIGIBLE_ROLES)[number];

export const SECTION_ASSISTANT_ELIGIBLE_ROLES = ["teacher", "assistant", "student", "admin"] as const;
export type SectionAssistantEligibleRole = (typeof SECTION_ASSISTANT_ELIGIBLE_ROLES)[number];

export function isProfileEligibleAsSectionLeadTeacher(role: string | null | undefined): boolean {
  if (!role) return false;
  return (SECTION_LEAD_TEACHER_ELIGIBLE_ROLES as readonly string[]).includes(role);
}

export function isProfileEligibleAsSectionAssistant(role: string | null | undefined): boolean {
  if (!role) return false;
  return (SECTION_ASSISTANT_ELIGIBLE_ROLES as readonly string[]).includes(role);
}
