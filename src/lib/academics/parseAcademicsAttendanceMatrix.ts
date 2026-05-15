export interface AcademicsAttendanceMatrixValues {
  teacher: {
    scanLookbackBufferDays: number;
    operationalCivilLookbackDays: number;
    operationalMaxClassDays: number;
    fullCourseMaxClassDays: number;
  };
  admin: {
    fallbackLookbackDays: number;
    maxClassDays: number;
  };
  pickAdjacentCivilDays: number;
  hasEligibleWindowMaxScans: number;
}

const DEFAULTS: AcademicsAttendanceMatrixValues = {
  teacher: {
    scanLookbackBufferDays: 7,
    operationalCivilLookbackDays: 14,
    operationalMaxClassDays: 28,
    fullCourseMaxClassDays: 156,
  },
  admin: {
    fallbackLookbackDays: 400,
    maxClassDays: 520,
  },
  pickAdjacentCivilDays: 14,
  hasEligibleWindowMaxScans: 400,
};

function boundedInt(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(max, Math.max(min, Math.trunc(raw)));
  }
  if (typeof raw === "string") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  }
  return fallback;
}

export function parseAcademicsAttendanceMatrix(
  raw: unknown,
  defaults: AcademicsAttendanceMatrixValues = DEFAULTS,
): AcademicsAttendanceMatrixValues {
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Record<string, unknown>;
  const teacher = (r.teacher && typeof r.teacher === "object"
    ? (r.teacher as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const admin = (r.admin && typeof r.admin === "object"
    ? (r.admin as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  return {
    teacher: {
      scanLookbackBufferDays: boundedInt(
        teacher.scanLookbackBufferDays,
        defaults.teacher.scanLookbackBufferDays,
        0,
        31,
      ),
      operationalCivilLookbackDays: boundedInt(
        teacher.operationalCivilLookbackDays,
        defaults.teacher.operationalCivilLookbackDays,
        1,
        180,
      ),
      operationalMaxClassDays: boundedInt(
        teacher.operationalMaxClassDays,
        defaults.teacher.operationalMaxClassDays,
        4,
        400,
      ),
      fullCourseMaxClassDays: boundedInt(
        teacher.fullCourseMaxClassDays,
        defaults.teacher.fullCourseMaxClassDays,
        10,
        800,
      ),
    },
    admin: {
      fallbackLookbackDays: boundedInt(
        admin.fallbackLookbackDays,
        defaults.admin.fallbackLookbackDays,
        30,
        5000,
      ),
      maxClassDays: boundedInt(
        admin.maxClassDays,
        defaults.admin.maxClassDays,
        50,
        3000,
      ),
    },
    pickAdjacentCivilDays: boundedInt(
      r.pickAdjacentCivilDays,
      defaults.pickAdjacentCivilDays,
      1,
      60,
    ),
    hasEligibleWindowMaxScans: boundedInt(
      r.hasEligibleWindowMaxScans,
      defaults.hasEligibleWindowMaxScans,
      50,
      2000,
    ),
  };
}

export const ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS = DEFAULTS;
