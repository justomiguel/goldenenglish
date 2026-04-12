import type { SupabaseClient } from "@supabase/supabase-js";

export type ParentChildSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  attendancePercent: number | null;
  levelLabel: string | null;
  nextExamAt: string | null;
  nextEventAt: string | null;
  nextEventLabel: string | null;
};

export async function loadParentChildrenSummaries(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ParentChildSummary[]> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);

  const ids = (links ?? []).map((l) => l.student_id as string);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, next_exam_at, student_portal_next_event_at, student_portal_next_event_label",
    )
    .in("id", ids);

  const out: ParentChildSummary[] = [];

  for (const p of profiles ?? []) {
    const sid = p.id as string;

    const { data: attRows } = await supabase
      .from("attendance")
      .select("status")
      .eq("student_id", sid)
      .eq("is_mandatory", true);

    let attendancePercent: number | null = null;
    if (attRows && attRows.length > 0) {
      const present = attRows.filter((a) => a.status === "present").length;
      attendancePercent = Math.round((present / attRows.length) * 100);
    }

    const { data: enr } = await supabase
      .from("enrollments")
      .select("enrolled_at, courses (level, name)")
      .eq("student_id", sid)
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const course = enr?.courses;
    let levelLabel: string | null = null;
    if (course && typeof course === "object" && "level" in course) {
      levelLabel = String((course as { level: string }).level);
    }

    out.push({
      studentId: sid,
      firstName: p.first_name as string,
      lastName: p.last_name as string,
      attendancePercent,
      levelLabel,
      nextExamAt: p.next_exam_at ? String(p.next_exam_at).slice(0, 10) : null,
      nextEventAt: p.student_portal_next_event_at
        ? String(p.student_portal_next_event_at)
        : null,
      nextEventLabel:
        (p.student_portal_next_event_label as string | null) ?? null,
    });
  }

  return out;
}
