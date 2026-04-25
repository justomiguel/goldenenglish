import type { SupabaseClient } from "@supabase/supabase-js";
import { countTrailingAbsences } from "@/lib/academics/sectionAttendanceRetention";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type AdminRetentionCandidate = {
  enrollmentId: string;
  studentId: string;
  studentLabel: string;
  sectionId: string;
  sectionName: string;
  trailingAbsences: number;
  avgScore: number | null;
  watch: boolean;
  guardianPhoneDigits: string | null;
  guardianLabel: string | null;
  reasons: ("absences" | "low_average")[];
};

function digitsOnly(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

export async function loadAdminRetentionCandidates(supabase: SupabaseClient): Promise<AdminRetentionCandidate[]> {
  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select(
      "id, student_id, section_id, status, profiles!student_id(first_name,last_name), academic_sections(name)",
    )
    .in("status", ["active", "completed"]);

  const raw = (enrollments ?? []) as {
    id: string;
    student_id: string;
    section_id: string;
    status: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
    academic_sections: { name: string } | { name: string }[] | null;
  }[];

  if (raw.length === 0) return [];

  const enrollmentIds = raw.map((r) => r.id);
  const studentIds = [...new Set(raw.map((r) => r.student_id))];

  const [{ data: flags }, { data: avgs }, { data: attRows }, { data: tutors }] = await Promise.all([
    supabase.from("enrollment_retention_flags").select("enrollment_id, watch").in("enrollment_id", enrollmentIds),
    supabase.from("v_section_enrollment_grade_average").select("enrollment_id, avg_score").in("enrollment_id", enrollmentIds),
    supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", enrollmentIds)
      .gte("attended_on", new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10)),
    supabase.from("tutor_student_rel").select("student_id, tutor_id").in("student_id", studentIds),
  ]);

  const watchMap = new Map((flags ?? []).map((f) => [f.enrollment_id as string, Boolean(f.watch)]));
  const avgMap = new Map((avgs ?? []).map((a) => [a.enrollment_id as string, Number(a.avg_score)]));
  const tutorIds = [...new Set((tutors ?? []).map((t) => t.tutor_id as string))];
  const { data: tutorProfiles } = tutorIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, phone").in("id", tutorIds)
    : { data: [] as { id: string; first_name: string; last_name: string; phone: string | null }[] };

  const profileById = new Map(
    (tutorProfiles ?? []).map((p) => [
      p.id as string,
      {
        label: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        phoneDigits: digitsOnly(p.phone),
      },
    ]),
  );

  const tutorsByStudent = new Map<string, string[]>();
  for (const t of tutors ?? []) {
    const sid = t.student_id as string;
    const list = tutorsByStudent.get(sid) ?? [];
    list.push(t.tutor_id as string);
    tutorsByStudent.set(sid, list);
  }

  const attByEnrollment = new Map<string, { attended_on: string; status: SectionAttendanceStatusDb }[]>();
  for (const row of attRows ?? []) {
    const eid = row.enrollment_id as string;
    const list = attByEnrollment.get(eid) ?? [];
    list.push({
      attended_on: String(row.attended_on),
      status: row.status as SectionAttendanceStatusDb,
    });
    attByEnrollment.set(eid, list);
  }

  const out: AdminRetentionCandidate[] = [];

  for (const r of raw) {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const studentLabel = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
    const secRaw = r.academic_sections;
    const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw;
    const sectionName = sec?.name ?? "";

    const hist = (attByEnrollment.get(r.id) ?? []).sort((a, b) => (a.attended_on < b.attended_on ? 1 : -1));
    const trailingAbsences = countTrailingAbsences(hist);
    const avgScore = avgMap.get(r.id);
    const avg = avgScore != null && Number.isFinite(avgScore) ? avgScore : null;

    const reasons: ("absences" | "low_average")[] = [];
    if (trailingAbsences >= 2) reasons.push("absences");
    if (avg != null && avg < 6) reasons.push("low_average");
    if (reasons.length === 0) continue;

    let guardianPhoneDigits: string | null = null;
    let guardianLabel: string | null = null;
    for (const tid of tutorsByStudent.get(r.student_id) ?? []) {
      const prof = profileById.get(tid);
      if (prof?.phoneDigits) {
        guardianPhoneDigits = prof.phoneDigits;
        guardianLabel = prof.label || null;
        break;
      }
    }

    out.push({
      enrollmentId: r.id,
      studentId: r.student_id,
      studentLabel,
      sectionId: r.section_id,
      sectionName,
      trailingAbsences,
      avgScore: avg,
      watch: watchMap.get(r.id) ?? false,
      guardianPhoneDigits,
      guardianLabel,
      reasons,
    });
  }

  out.sort((a, b) => {
    if (b.trailingAbsences !== a.trailingAbsences) return b.trailingAbsences - a.trailingAbsences;
    const aa = a.avgScore ?? 10;
    const ba = b.avgScore ?? 10;
    return aa - ba;
  });

  return out;
}
