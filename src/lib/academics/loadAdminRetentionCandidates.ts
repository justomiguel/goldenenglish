import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAdminRetentionRows,
  digitsOnly,
  type RawEnrollmentRow,
} from "@/lib/academics/buildAdminRetentionRows";
import { batchAuthEmailsForUserIds } from "@/lib/auth/batchAuthEmailsForUserIds";
import type {
  AdminRetentionCandidate,
  LoadAdminRetentionOptions,
  LoadAdminRetentionResult,
} from "@/types/adminRetention";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type { AdminRetentionCandidate, LoadAdminRetentionOptions, LoadAdminRetentionResult };

export async function loadAdminRetentionCandidates(
  supabase: SupabaseClient,
  options?: LoadAdminRetentionOptions,
): Promise<LoadAdminRetentionResult> {
  let sectionIdFilter: string[] | null = null;
  if (options?.cohortId) {
    const { data: secs } = await supabase
      .from("academic_sections")
      .select("id")
      .eq("cohort_id", options.cohortId);
    sectionIdFilter = ((secs ?? []) as { id: string }[]).map((s) => s.id);
    if (sectionIdFilter.length === 0) return { rows: [], total: 0 };
  }

  let enrollmentsQuery = supabase
    .from("section_enrollments")
    .select(
      "id, student_id, section_id, status, profiles!student_id(first_name,last_name,is_minor,phone), academic_sections(name)",
    )
    .in("status", ["active", "completed"]);
  if (sectionIdFilter) {
    enrollmentsQuery = enrollmentsQuery.in("section_id", sectionIdFilter);
  }
  if (options?.enrollmentId) {
    enrollmentsQuery = enrollmentsQuery.eq("id", options.enrollmentId);
  }

  const { data: enrollments } = await enrollmentsQuery;

  const raw = (enrollments ?? []) as RawEnrollmentRow[];

  if (raw.length === 0) return { rows: [], total: 0 };

  const enrollmentIds = raw.map((r) => r.id);
  const studentIds = [...new Set(raw.map((r) => r.student_id))];

  const [{ data: flags }, { data: avgs }, { data: attRows }, { data: tutors }] = await Promise.all([
    supabase
      .from("enrollment_retention_flags")
      .select("enrollment_id, whatsapp_contact_count, email_contact_count")
      .in("enrollment_id", enrollmentIds),
    supabase.from("v_section_enrollment_grade_average").select("enrollment_id, avg_score").in("enrollment_id", enrollmentIds),
    supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", enrollmentIds)
      .gte("attended_on", new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10)),
    supabase.from("tutor_student_rel").select("student_id, tutor_id").in("student_id", studentIds),
  ]);

  const countsByEnrollment = new Map(
    (flags ?? []).map((f) => {
      const row = f as {
        enrollment_id: string;
        whatsapp_contact_count?: number | null;
        email_contact_count?: number | null;
      };
      return [
        row.enrollment_id,
        {
          wa: Math.max(0, Number(row.whatsapp_contact_count ?? 0)),
          em: Math.max(0, Number(row.email_contact_count ?? 0)),
        },
      ];
    }),
  );
  const avgMap = new Map((avgs ?? []).map((a) => [a.enrollment_id as string, Number(a.avg_score)]));
  const tutorIds = [...new Set((tutors ?? []).map((t) => t.tutor_id as string))];
  const { data: tutorProfiles } = tutorIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, phone").in("id", tutorIds)
    : { data: [] as { id: string; first_name: string; last_name: string; phone: string | null }[] };

  const profileById = new Map(
    (tutorProfiles ?? []).map((p) => {
      const phoneTrim = (p.phone ?? "").trim();
      const phoneDigits = digitsOnly(p.phone);
      return [
        p.id as string,
        {
          label: formatProfileSnakeSurnameFirst(p),
          phoneDigits,
          phoneDisplay: phoneTrim.length > 0 ? phoneTrim : phoneDigits && phoneDigits.length > 0 ? `+${phoneDigits}` : null,
        },
      ];
    }),
  );

  const tutorsByStudent = new Map<string, string[]>();
  for (const t of tutors ?? []) {
    const sid = t.student_id as string;
    const list = tutorsByStudent.get(sid) ?? [];
    list.push(t.tutor_id as string);
    tutorsByStudent.set(sid, list);
  }

  const selfPayerStudentIds: string[] = [];
  for (const row of raw) {
    const pr = row.profiles;
    const p = Array.isArray(pr) ? pr[0] : pr;
    const sid = row.student_id;
    const hasTutors = (tutorsByStudent.get(sid) ?? []).length > 0;
    const minor = Boolean(p?.is_minor);
    if (!hasTutors && p && !minor) {
      selfPayerStudentIds.push(sid);
    }
  }
  const emailUserIds = [...new Set([...tutorIds, ...selfPayerStudentIds])];
  const emailByUserId = await batchAuthEmailsForUserIds(emailUserIds);

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

  const out = buildAdminRetentionRows({
    raw,
    avgMap,
    countsByEnrollment,
    tutorsByStudent,
    profileById,
    attByEnrollment,
    emailByUserId,
  });

  out.sort((a, b) => {
    if (b.trailingAbsences !== a.trailingAbsences) return b.trailingAbsences - a.trailingAbsences;
    const aa = a.avgScore ?? 10;
    const ba = b.avgScore ?? 10;
    return aa - ba;
  });

  const total = out.length;
  if (options?.page != null && options?.pageSize != null) {
    const page = Math.max(1, options.page);
    const size = Math.min(100, Math.max(1, options.pageSize));
    const start = (page - 1) * size;
    return { rows: out.slice(start, start + size), total };
  }
  return { rows: out, total };
}
