import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { listTeacherTodayClassesUtc } from "@/lib/academics/teacherDashboardTodayClassesUtc";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import type { TeacherDashboardModel, TeacherDashboardSectionGrade } from "@/types/teacherDashboard";
import { countFamilyInboundThreadsAwaitingReply } from "@/lib/teacher/countFamilyInboundThreadsAwaitingReply";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

function sectionLabel(name: string, cohort: string): string {
  return cohort ? `${cohort} — ${name}` : name;
}

export async function loadTeacherDashboardModel(
  supabase: SupabaseClient,
  userId: string,
): Promise<TeacherDashboardModel> {
  const now = new Date();
  const sectionIds = await loadTeacherSectionIdsForUser(supabase, userId);
  if (sectionIds.length === 0) {
    return {
      todayClasses: [],
      retentionOpenCount: 0,
      familyMessageAttentionCount: 0,
      sectionGrades: [],
    };
  }

  const sections = await chunkedIn<{
    id: string;
    name: string;
    schedule_slots: unknown;
    academic_cohorts: CohortCell;
  }>(supabase, "academic_sections", "id", sectionIds, "id, name, schedule_slots, academic_cohorts(name)");

  const sectionInputs = sections.map((s) => ({
    id: s.id as string,
    name: s.name as string,
    cohortName: cohortName(s.academic_cohorts as CohortCell),
    schedule_slots: s.schedule_slots,
  }));

  const todayClasses = listTeacherTodayClassesUtc(sectionInputs, now);

  const [{ count: retentionCount }, msgsRes, enrRes] = await Promise.all([
    supabase
      .from("retention_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("portal_messages")
      .select("sender_id, recipient_id")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("section_enrollments")
      .select("id, section_id")
      .in("section_id", sectionIds)
      .eq("status", "active"),
  ]);

  const msgs = msgsRes.data ?? [];
  const idSet = new Set<string>();
  for (const m of msgs) {
    idSet.add(m.sender_id as string);
    idSet.add(m.recipient_id as string);
  }
  const idList = [...idSet];
  const { data: rolesRows } = idList.length
    ? await supabase.from("profiles").select("id, role").in("id", idList)
    : { data: [] as { id: string; role: string }[] };

  const roleByUserId = new Map((rolesRows ?? []).map((r) => [r.id as string, r.role as string]));
  const familyMessageAttentionCount = countFamilyInboundThreadsAwaitingReply(
    msgs as { sender_id: string; recipient_id: string }[],
    userId,
    roleByUserId,
  );

  const enrollments = (enrRes.data ?? []) as { id: string; section_id: string }[];
  const enrollmentIds = enrollments.map((e) => e.id);

  const gradeAvgs =
    enrollmentIds.length === 0
      ? []
      : await chunkedIn<{ enrollment_id: string; avg_score: string | number }>(
          supabase,
          "v_section_enrollment_grade_average",
          "enrollment_id",
          enrollmentIds,
          "enrollment_id, avg_score",
        );

  const scoreByEnrollment = new Map<string, number>();
  for (const g of gradeAvgs) {
    scoreByEnrollment.set(g.enrollment_id as string, Number(g.avg_score));
  }

  const enrIdsBySection = new Map<string, string[]>();
  for (const e of enrollments) {
    const cur = enrIdsBySection.get(e.section_id) ?? [];
    cur.push(e.id);
    enrIdsBySection.set(e.section_id, cur);
  }

  const sortedInputs = [...sectionInputs].sort((a, b) =>
    sectionLabel(a.name, a.cohortName).localeCompare(sectionLabel(b.name, b.cohortName)),
  );

  const sectionGrades: TeacherDashboardSectionGrade[] = sortedInputs.map((sec) => {
    const eids = enrIdsBySection.get(sec.id) ?? [];
    const scores = eids
      .map((id) => scoreByEnrollment.get(id))
      .filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
    const avgScore =
      scores.length === 0
        ? null
        : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    return {
      sectionId: sec.id,
      label: sectionLabel(sec.name, sec.cohortName),
      avgScore,
    };
  });

  return {
    todayClasses,
    retentionOpenCount: retentionCount ?? 0,
    familyMessageAttentionCount,
    sectionGrades,
  };
}
