export type CourseOrigin = "section" | "purchase" | "assignment";

export type CourseAccessInput = {
  published: boolean;
  /** Sections that grant this course, via the section route or a direct assignment. */
  grantingSectionIds: readonly string[];
  /** Sections where this student has an active enrollment. */
  activeEnrollmentSectionIds: readonly string[];
  personalGrant: "purchase" | "assignment" | null;
};

export type CourseAccess = {
  visible: boolean;
  origins: CourseOrigin[];
};

/**
 * A draft is never visible. A section grant lasts only while the enrollment is active.
 * A personal grant stays after the student leaves the section.
 */
export function resolveCourseAccess(input: CourseAccessInput): CourseAccess {
  if (!input.published) return { visible: false, origins: [] };

  const enrolled = new Set(input.activeEnrollmentSectionIds);
  const viaSection = input.grantingSectionIds.some((sectionId) => enrolled.has(sectionId));
  const origins: CourseOrigin[] = [];
  if (viaSection) origins.push("section");
  if (input.personalGrant === "purchase") origins.push("purchase");
  if (input.personalGrant === "assignment") origins.push("assignment");

  return { visible: origins.length > 0, origins };
}
