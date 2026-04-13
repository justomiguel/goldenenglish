import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type AdminAttendanceMatrixCell = SectionAttendanceStatusDb | null;

export type AdminAttendanceMatrixRow = {
  enrollmentId: string;
  studentLabel: string;
  cells: Record<string, AdminAttendanceMatrixCell>;
};

export type AdminAttendanceMatrixModel = {
  dates: string[];
  rows: AdminAttendanceMatrixRow[];
};

const WINDOW_DAYS = 28;

function rollingUtcDatesInclusive(end: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const x = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export async function loadAdminSectionAttendanceMatrix(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<AdminAttendanceMatrixModel> {
  const end = new Date();
  const dates = rollingUtcDatesInclusive(end, WINDOW_DAYS);
  const sinceIso = dates[0] ?? end.toISOString().slice(0, 10);

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, student_id, status, profiles(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: true });

  const enr = (enrollments ?? []) as {
    id: string;
    student_id: string;
    status: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  }[];

  const enrollmentIds = enr.map((r) => r.id);
  if (enrollmentIds.length === 0) {
    return { dates, rows: [] };
  }

  const { data: att } = await supabase
    .from("section_attendance")
    .select("enrollment_id, attended_on, status")
    .in("enrollment_id", enrollmentIds)
    .gte("attended_on", sinceIso);

  const byEnrDate = new Map<string, Map<string, SectionAttendanceStatusDb>>();
  for (const a of att ?? []) {
    const eid = a.enrollment_id as string;
    const d = String(a.attended_on).slice(0, 10);
    if (!dates.includes(d)) continue;
    const inner = byEnrDate.get(eid) ?? new Map();
    inner.set(d, a.status as SectionAttendanceStatusDb);
    byEnrDate.set(eid, inner);
  }

  const rows: AdminAttendanceMatrixRow[] = enr.map((r) => {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const studentLabel = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
    const cells: Record<string, AdminAttendanceMatrixCell> = {};
    const map = byEnrDate.get(r.id);
    for (const d of dates) {
      cells[d] = map?.get(d) ?? null;
    }
    return { enrollmentId: r.id, studentLabel, cells };
  });

  return { dates, rows };
}
