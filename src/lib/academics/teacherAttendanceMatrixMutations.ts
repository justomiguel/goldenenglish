import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { isTeacherAttendanceDateAllowedForSection } from "@/lib/academics/teacherSectionAttendanceCalendar";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type MatrixMutationCode = "forbidden" | "invalid_class_date" | "save" | "nothing_to_fill";

export type SectionScheduleMetaRow = {
  starts_on: string | null;
  ends_on: string | null;
  schedule_slots: unknown;
};

export async function loadSectionScheduleMetaForAttendance(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<{ data: SectionScheduleMetaRow | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("academic_sections")
    .select("starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();
  return { data: data as SectionScheduleMetaRow | null, error };
}

export function enrollmentBulkFillable(status: string): boolean {
  return status === "active" || status === "completed";
}

export async function runTeacherAttendanceColumnFill(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  attendedOn: string,
): Promise<{ ok: true; insertedEnrollmentIds: string[] } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) {
    logSupabaseClientError("runTeacherAttendanceColumnFill:meta", metaErr, { sectionId });
    return { ok: false, code: "forbidden" };
  }
  const slots = parseSectionScheduleSlots(meta.schedule_slots);
  const now = new Date();
  const calendarTimeZone = getInstituteTimeZone();
  if (
    !isTeacherAttendanceDateAllowedForSection(attendedOn, now, {
      sectionStartsOn: meta.starts_on,
      sectionEndsOn: meta.ends_on,
      scheduleSlots: slots,
      calendarTimeZone,
    })
  ) {
    return { ok: false, code: "invalid_class_date" };
  }

  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, status, created_at, updated_at")
    .eq("section_id", sectionId);
  if (enrErr || !enrollments?.length) {
    logSupabaseClientError("runTeacherAttendanceColumnFill:enr", enrErr, { sectionId });
    return { ok: false, code: "forbidden" };
  }

  const candidates: string[] = [];
  for (const row of enrollments) {
    const st = String(row.status ?? "");
    if (!enrollmentBulkFillable(st)) continue;
    if (
      !enrollmentEligibleForAttendanceOnDate(
        attendedOn,
        String(row.created_at ?? ""),
        st,
        String(row.updated_at ?? ""),
        { sectionStartsOn: meta.starts_on },
      )
    ) {
      continue;
    }
    candidates.push(row.id as string);
  }

  if (candidates.length === 0) return { ok: false, code: "nothing_to_fill" };

  const { data: existing, error: exErr } = await supabase
    .from("section_attendance")
    .select("enrollment_id")
    .eq("attended_on", attendedOn)
    .in("enrollment_id", candidates);
  if (exErr) {
    logSupabaseClientError("runTeacherAttendanceColumnFill:existing", exErr, { sectionId, attendedOn });
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
    logSupabaseClientError("runTeacherAttendanceColumnFill:insert", insErr, {
      sectionId,
      attendedOn,
      n: rows.length,
    });
    return { ok: false, code: "save" };
  }

  return { ok: true, insertedEnrollmentIds: toInsert };
}

export async function runTeacherAttendanceColumnUndo(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  attendedOn: string,
  enrollmentIds: string[],
): Promise<{ ok: true } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) return { ok: false, code: "forbidden" };
  const slots = parseSectionScheduleSlots(meta.schedule_slots);
  const now = new Date();
  const calendarTimeZone = getInstituteTimeZone();
  if (
    !isTeacherAttendanceDateAllowedForSection(attendedOn, now, {
      sectionStartsOn: meta.starts_on,
      sectionEndsOn: meta.ends_on,
      scheduleSlots: slots,
      calendarTimeZone,
    })
  ) {
    return { ok: false, code: "invalid_class_date" };
  }

  const { error: delErr } = await supabase
    .from("section_attendance")
    .delete()
    .eq("attended_on", attendedOn)
    .eq("recorded_by", profileId)
    .in("enrollment_id", enrollmentIds);
  if (delErr) {
    logSupabaseClientError("runTeacherAttendanceColumnUndo", delErr, { sectionId, attendedOn });
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

export async function runTeacherAttendanceCellsUpsert(
  supabase: SupabaseClient,
  profileId: string,
  sectionId: string,
  cells: CellIn[],
): Promise<{ ok: true } | { ok: false; code: MatrixMutationCode }> {
  const { data: meta, error: metaErr } = await loadSectionScheduleMetaForAttendance(supabase, sectionId);
  if (metaErr || !meta) return { ok: false, code: "forbidden" };
  const slots = parseSectionScheduleSlots(meta.schedule_slots);
  const now = new Date();
  const metaArgs = {
    sectionStartsOn: meta.starts_on,
    sectionEndsOn: meta.ends_on,
    scheduleSlots: slots,
    calendarTimeZone: getInstituteTimeZone(),
  };

  const ids = [...new Set(cells.map((c) => c.enrollmentId))];
  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, status, created_at, updated_at, section_id")
    .eq("section_id", sectionId)
    .in("id", ids);
  if (enrErr || !enrollments || enrollments.length !== ids.length) {
    return { ok: false, code: "forbidden" };
  }
  const enrById = new Map(enrollments.map((r) => [r.id as string, r]));

  const upsertRows: {
    enrollment_id: string;
    attended_on: string;
    status: SectionAttendanceStatusDb;
    notes: string | null;
    recorded_by: string;
  }[] = [];

  for (const c of cells) {
    if (!isTeacherAttendanceDateAllowedForSection(c.attendedOn, now, metaArgs)) {
      return { ok: false, code: "invalid_class_date" };
    }
    const row = enrById.get(c.enrollmentId)!;
    const st = String(row.status ?? "");
    if (
      !enrollmentEligibleForAttendanceOnDate(
        c.attendedOn,
        String(row.created_at ?? ""),
        st,
        String(row.updated_at ?? ""),
        { sectionStartsOn: meta.starts_on },
      )
    ) {
      return { ok: false, code: "forbidden" };
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
    logSupabaseClientError("runTeacherAttendanceCellsUpsert", error, { sectionId, n: upsertRows.length });
    return { ok: false, code: "save" };
  }
  return { ok: true };
}
