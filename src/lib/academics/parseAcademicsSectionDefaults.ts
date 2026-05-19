export interface AcademicsSectionDefaults {
  maxStudents: number;
  minAttendancePercent: number;
  teacherPortalRoles: readonly string[];
}

const DEFAULTS: AcademicsSectionDefaults = {
  maxStudents: 60,
  minAttendancePercent: 75,
  teacherPortalRoles: ["teacher", "assistant"],
};

function parseRolesArray(raw: unknown): readonly string[] | null {
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const r of raw) {
      if (typeof r === "string") {
        const t = r.trim();
        if (t) out.push(t);
      }
    }
    return out.length ? out : null;
  }
  if (typeof raw === "string") {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : null;
  }
  return null;
}

export function parseAcademicsSectionDefaults(
  raw: unknown,
  defaults: AcademicsSectionDefaults = DEFAULTS,
): AcademicsSectionDefaults {
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Record<string, unknown>;
  let maxStudents = defaults.maxStudents;
  if (typeof r.maxStudents === "number" && Number.isFinite(r.maxStudents) && r.maxStudents > 0) {
    maxStudents = Math.trunc(r.maxStudents);
  } else if (typeof r.maxStudents === "string") {
    const n = Number.parseInt(r.maxStudents, 10);
    if (Number.isFinite(n) && n > 0) maxStudents = n;
  }
  let minAttendancePercent = defaults.minAttendancePercent;
  if (
    typeof r.minAttendancePercent === "number" &&
    Number.isFinite(r.minAttendancePercent) &&
    r.minAttendancePercent >= 0 &&
    r.minAttendancePercent <= 100
  ) {
    minAttendancePercent = Math.trunc(r.minAttendancePercent);
  } else if (typeof r.minAttendancePercent === "string") {
    const n = Number.parseInt(r.minAttendancePercent, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 100) minAttendancePercent = n;
  }
  const roles = parseRolesArray(r.teacherPortalRoles) ?? defaults.teacherPortalRoles;
  return { maxStudents, minAttendancePercent, teacherPortalRoles: roles };
}

export const ACADEMICS_SECTION_DEFAULTS = DEFAULTS;
