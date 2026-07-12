/** Pure helpers for guide-only create-user tour demos (no Auth/submit). */

export type CreateUserTourBirthPath = "minor" | "adult";

export type CreateUserTourDemoDetail = {
  role: "student" | "teacher" | "admin";
  /** When role is student, sets a sample birth date so guardian vs email UI appears. */
  birthPath?: CreateUserTourBirthPath;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar date → `YYYY-MM-DD` (same shape as the birth picker). */
export function isoYmdYearsAgo(years: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear() - years, from.getMonth(), from.getDate());
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Sample birth ISO so age is clearly under or at/above majority.
 * Minor: majority − 1 years old. Adult: majority + 5 years old.
 */
export function demoBirthIsoForTourPath(
  path: CreateUserTourBirthPath,
  legalAgeMajority: number,
  from: Date = new Date(),
): string {
  const majority = Number.isFinite(legalAgeMajority) && legalAgeMajority > 0 ? legalAgeMajority : 18;
  if (path === "minor") {
    return isoYmdYearsAgo(Math.max(1, majority - 1), from);
  }
  return isoYmdYearsAgo(majority + 5, from);
}
