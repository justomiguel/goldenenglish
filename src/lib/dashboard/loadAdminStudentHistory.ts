import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  formatDateOnly,
  mapAuditRowToStudentHistoryItem,
  type AdminStudentAuditHistoryItem,
  type AdminStudentCohortHistoryItem,
  type AdminStudentHistoryData,
  type ProfileNameRow,
  type RawAuditEventRow,
} from "@/lib/dashboard/adminStudentHistoryMap";

export type {
  AdminStudentAuditChangePair,
  AdminStudentAuditHistoryItem,
  AdminStudentCohortHistoryItem,
  AdminStudentHistoryData,
  RawAuditEventRow,
} from "@/lib/dashboard/adminStudentHistoryMap";
export { mapAuditRowToStudentHistoryItem } from "@/lib/dashboard/adminStudentHistoryMap";

export async function loadAdminStudentHistory(
  admin: SupabaseClient,
  studentId: string,
  locale: string,
  emptyDisplay = "—",
): Promise<AdminStudentHistoryData> {
  const [enrResult, auditResult] = await Promise.all([
    admin
      .from("section_enrollments")
      .select("id, section_id, status, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("audit_events")
      .select(
        "id, actor_id, actor_role, domain, action, resource_type, resource_id, summary, before_values, after_values, diff, metadata, created_at",
      )
      .eq("resource_id", studentId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (enrResult.error) {
    logSupabaseClientError("loadAdminStudentHistory:enrollments", enrResult.error, {
      studentId,
    });
  }
  if (auditResult.error) {
    logSupabaseClientError("loadAdminStudentHistory:auditEvents", auditResult.error, {
      studentId,
    });
  }

  const enrollmentRows = ((enrResult.data ?? []) as Array<{
    id: string;
    section_id: string;
    status: string;
    created_at?: string | null;
  }>);

  const sectionIds = [...new Set(enrollmentRows.map((row) => String(row.section_id)).filter(Boolean))];
  const sectionById = new Map<
    string,
    { id: string; name: string; cohort_id: string; teacher_id: string | null }
  >();

  if (sectionIds.length > 0) {
    const { data: secRows, error: secErr } = await admin
      .from("academic_sections")
      .select("id, name, cohort_id, teacher_id")
      .in("id", sectionIds);
    if (secErr) {
      logSupabaseClientError("loadAdminStudentHistory:sections", secErr, { studentId });
    }
    for (const s of (secRows ?? []) as Array<{
      id: string;
      name: string;
      cohort_id: string;
      teacher_id: string | null;
    }>) {
      sectionById.set(String(s.id), s);
    }
  }

  const cohortIds = [
    ...new Set([...sectionById.values()].map((s) => String(s.cohort_id)).filter(Boolean)),
  ];
  const cohortById = new Map<string, { id: string; name: string; is_current: boolean }>();

  if (cohortIds.length > 0) {
    const { data: cohRows, error: cohErr } = await admin
      .from("academic_cohorts")
      .select("id, name, is_current")
      .in("id", cohortIds);
    if (cohErr) {
      logSupabaseClientError("loadAdminStudentHistory:cohorts", cohErr, { studentId });
    }
    for (const c of (cohRows ?? []) as Array<{
      id: string;
      name: string;
      is_current: boolean | null;
    }>) {
      cohortById.set(String(c.id), {
        id: String(c.id),
        name: String(c.name ?? emptyDisplay),
        is_current: c.is_current === true,
      });
    }
  }

  const auditRows = (auditResult.data ?? []) as unknown as RawAuditEventRow[];
  const profileIds = [
    ...new Set(
      [
        ...[...sectionById.values()].map((s) => s.teacher_id),
        ...auditRows.map((a) => a.actor_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];

  const profileById = new Map<string, ProfileNameRow>();
  if (profileIds.length > 0) {
    const { data: profRows } = await admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds);
    for (const p of (profRows ?? []) as ProfileNameRow[]) {
      profileById.set(String(p.id), p);
    }
  }

  const cohorts: AdminStudentCohortHistoryItem[] = enrollmentRows.map((row) => {
    const section = sectionById.get(String(row.section_id));
    const cohort = section ? cohortById.get(String(section.cohort_id)) : undefined;
    const teacherProfile =
      section?.teacher_id ? profileById.get(String(section.teacher_id)) : undefined;
    return {
      enrollmentId: String(row.id),
      cohortId: cohort?.id ?? section?.cohort_id ?? "",
      cohortName: cohort?.name ?? emptyDisplay,
      cohortIsCurrent: cohort?.is_current ?? false,
      sectionId: String(row.section_id),
      sectionName: section?.name ?? emptyDisplay,
      teacherName: teacherProfile
        ? formatProfileSnakeSurnameFirst(teacherProfile, emptyDisplay)
        : emptyDisplay,
      status: String(row.status ?? "active"),
      enrolledAtDisplay: formatDateOnly(locale, row.created_at, emptyDisplay),
    };
  });

  const auditEvents: AdminStudentAuditHistoryItem[] = auditRows.map((row) =>
    mapAuditRowToStudentHistoryItem(row, profileById, locale, emptyDisplay),
  );

  return { cohorts, auditEvents };
}
