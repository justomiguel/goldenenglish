/**
 * Roles permitted as tutor_student_rel.tutor_id for guardian semantics aligned with
 * {@link ensureParentProfileByTutorDni} (reuses existing parent or admin by DNI).
 */
export function profileRoleEligibleAsLinkedStudentGuardian(role: unknown): boolean {
  const r = String(role ?? "").toLowerCase();
  return r === "parent" || r === "admin";
}
