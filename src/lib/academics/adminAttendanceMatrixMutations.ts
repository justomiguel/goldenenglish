import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import {
  loadSectionScheduleMetaForAttendance,
  type MatrixMutationCode,
} from "@/lib/academics/teacherAttendanceMatrixMutations";

/**
 * Admin variant of the attendance matrix mutators.
 *
 * Diferencias respecto al runner del docente
 * (`teacherAttendanceMatrixMutations.ts`):
 *
 * - El admin **no** está limitado por la ventana operativa del docente
 *   (`isTeacherAttendanceDateAllowedForSection`). Sólo se exige que la fecha
 *   esté dentro del período declarado de la sección
 *   (`starts_on..ends_on`), porque más allá del período no existe la
 *   "clase" como contrato académico (y los reportes mensuales del padre /
 *   alumno no contemplan filas fuera del período).
 * - El admin tiene `cellEligibility: "all"` y por lo tanto puede sobrescribir
 *   asistencia para alumnos `dropped`/`transferred` o anteriores a su
 *   `created_at`. Esto se alinea con `loadTeacherSectionAttendanceMatrix`
 *   cuando el caller pasa `cellEligibility: "all"`.
 * - El "deshacer" del admin sólo borra registros creados por el propio
 *   admin actual (`recorded_by = profileId`), igual que el del docente —
 *   evita borrar marcas históricas de otros usuarios.
 */

function attendedOnInsideSectionPeriod(
  attendedOn: string,
  startsOn: string | null,
  endsOn: string | null,
): boolean {
  if (startsOn && attendedOn < startsOn) return false;
  if (endsOn && attendedOn > endsOn) return false;
  return true;
}

export async function runAdminAttendanceColumnFill(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  attendedOn: string,
): Promise<{ ok: true; insertedEnrollmentIds: string[] } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) {
    logSupabaseClientError("runAdminAttendanceColumnFill:meta", metaErr, { sectionId });
    return { ok: false, code: "forbidden" };
  }
  if (!attendedOnInsideSectionPeriod(attendedOn, meta.starts_on, meta.ends_on)) {
    return { ok: false, code: "invalid_class_date" };
  }

  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, status")
    .eq("section_id", sectionId);
  if (enrErr || !enrollments?.length) {
    logSupabaseClientError("runAdminAttendanceColumnFill:enr", enrErr, { sectionId });
    return { ok: false, code: "forbidden" };
  }

  const candidates = enrollments
    .filter((row) => {
      const st = String(row.status ?? "");
      return st === "active" || st === "completed";
    })
    .map((row) => row.id as string);

  if (candidates.length === 0) return { ok: false, code: "nothing_to_fill" };

  const { data: existing, error: exErr } = await supabase
    .from("section_attendance")
    .select("enrollment_id")
    .eq("attended_on", attendedOn)
    .in("enrollment_id", candidates);
  if (exErr) {
    logSupabaseClientError("runAdminAttendanceColumnFill:existing", exErr, { sectionId, attendedOn });
    return { ok: false, code: "save" };
  }
  const hasRow = new Set((existing ?? []).map((r) => r.enrollment_id as string));
  const toInsert = candidates.filter((id) => !hasRow.has(id));
  if (toInsert.length === 0) return { ok: false, code: "nothing_to_fill" };

  const rows = toInsert.map((enrollment_id) => ({
    enrollment_id,
    attended_on: attendedOn,
    status: "present" as const,
    notes: null,
    recorded_by: profileId,
  }));

  const { error: insErr } = await supabase.from("section_attendance").insert(rows);
  if (insErr) {
    logSupabaseClientError("runAdminAttendanceColumnFill:insert", insErr, {
      sectionId,
      attendedOn,
      n: rows.length,
    });
    return { ok: false, code: "save" };
  }

  return { ok: true, insertedEnrollmentIds: toInsert };
}

export async function runAdminAttendanceColumnUndo(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  attendedOn: string,
  enrollmentIds: string[],
): Promise<{ ok: true } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) return { ok: false, code: "forbidden" };
  if (!attendedOnInsideSectionPeriod(attendedOn, meta.starts_on, meta.ends_on)) {
    return { ok: false, code: "invalid_class_date" };
  }

  const { error: delErr } = await supabase
    .from("section_attendance")
    .delete()
    .eq("attended_on", attendedOn)
    .eq("recorded_by", profileId)
    .in("enrollment_id", enrollmentIds);
  if (delErr) {
    logSupabaseClientError("runAdminAttendanceColumnUndo", delErr, { sectionId, attendedOn });
    return { ok: false, code: "save" };
  }
  return { ok: true };
}

type CellIn = {
  enrollmentId: string;
  attendedOn: string;
  status: SectionAttendanceStatusDb;
  notes?: string | null;
};

export async function runAdminAttendanceCellsUpsert(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  cells: CellIn[],
): Promise<{ ok: true } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) return { ok: false, code: "forbidden" };

  const ids = [...new Set(cells.map((c) => c.enrollmentId))];
  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, section_id")
    .eq("section_id", sectionId)
    .in("id", ids);
  if (enrErr || !enrollments || enrollments.length !== ids.length) {
    return { ok: false, code: "forbidden" };
  }

  const upsertRows: {
    enrollment_id: string;
    attended_on: string;
    status: SectionAttendanceStatusDb;
    notes: string | null;
    recorded_by: string;
  }[] = [];

  for (const c of cells) {
    if (!attendedOnInsideSectionPeriod(c.attendedOn, meta.starts_on, meta.ends_on)) {
      return { ok: false, code: "invalid_class_date" };
    }
    upsertRows.push({
      enrollment_id: c.enrollmentId,
      attended_on: c.attendedOn,
      status: c.status,
      notes: c.notes?.trim() ? c.notes.trim() : null,
      recorded_by: profileId,
    });
  }

  const { error } = await supabase.from("section_attendance").upsert(upsertRows, {
    onConflict: "enrollment_id,attended_on",
  });
  if (error) {
    logSupabaseClientError("runAdminAttendanceCellsUpsert", error, { sectionId, n: upsertRows.length });
    return { ok: false, code: "save" };
  }
  return { ok: true };
}
