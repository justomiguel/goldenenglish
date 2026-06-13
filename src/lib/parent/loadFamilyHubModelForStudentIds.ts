import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ParentHubLogisticsRow,
  ParentHubModel,
  ParentHubUpdateRow,
} from "@/types/parentHub";
import type { SectionScheduleSlot } from "@/types/academics";
import { loadParentPaymentPendingMap } from "@/lib/academics/parentPaymentPending";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { schedulesOverlap } from "@/lib/academics/detectScheduleOverlap";
import { buildPlainTextFamilyScheduleIcs } from "@/lib/calendar/buildFamilyScheduleIcs";
import { loadAcademicsSectionDefaults } from "@/lib/academics/loadAcademicsSectionDefaults";
import { loadSectionMinAttendanceOverrides } from "@/lib/academics/loadSectionMinAttendanceOverrides";
import { buildParentHubAttendanceSnapshot } from "@/lib/parent/buildParentHubAttendanceSnapshot";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

const emptyHub: ParentHubModel = {
  logisticsRows: [],
  scheduleOverlap: false,
  updates: [],
  icsDocument: null,
  childPaymentPending: {},
  attendanceLines: [],
  attendanceLevelByStudent: {},
};

/** Family hub model for an explicit set of student profile ids (parent wards or self). */
export async function loadFamilyHubModelForStudentIds(
  supabase: SupabaseClient,
  studentIds: string[],
  locale: string,
  icsEventTitle: string,
): Promise<ParentHubModel> {
  const ids = [...new Set(studentIds.filter(Boolean))];
  if (ids.length === 0) return emptyHub;

  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
  const nameBy = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameBy.set(
      p.id as string,
      formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
    );
  }

  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("id, student_id, status, section_id")
    .in("student_id", ids);

  const { minAttendancePercent: globalMin } = await loadAcademicsSectionDefaults();

  const sectionIds = [...new Set((enr ?? []).map((e) => e.section_id as string))];
  const sectionsMeta: Record<
    string,
    { name: string; schedule_slots: unknown; academic_cohorts: CohortCell }
  > = {};

  if (sectionIds.length) {
    const { data: secs } = await supabase
      .from("academic_sections")
      .select("id, name, schedule_slots, academic_cohorts(name)")
      .in("id", sectionIds);
    for (const s of secs ?? []) {
      sectionsMeta[s.id as string] = {
        name: s.name as string,
        schedule_slots: s.schedule_slots,
        academic_cohorts: s.academic_cohorts as CohortCell,
      };
    }
  }

  const sectionMinOverrideBySectionId = await loadSectionMinAttendanceOverrides(
    supabase,
    sectionIds,
  );

  const logisticsRows: ParentHubLogisticsRow[] = [];
  const mergedSlots = new Map<string, SectionScheduleSlot[]>();

  for (const row of enr ?? []) {
    const studentId = row.student_id as string;
    const meta = sectionsMeta[row.section_id as string];
    if (!meta) continue;
    const cn = cohortName(meta.academic_cohorts);
    const classLabel = cn ? `${cn} — ${meta.name}` : meta.name;
    const hum = formatAcademicScheduleSummary(meta.schedule_slots, locale);
    logisticsRows.push({
      studentId,
      childLabel: nameBy.get(studentId) ?? "",
      classLabel,
      scheduleHuman: hum,
      active: row.status === "active",
    });
    if (row.status === "active") {
      const slots = parseSectionScheduleSlots(meta.schedule_slots);
      const cur = mergedSlots.get(studentId) ?? [];
      mergedSlots.set(studentId, cur.concat(slots));
    }
  }

  const studentKeys = [...mergedSlots.keys()];
  let scheduleOverlap = false;
  for (let i = 0; i < studentKeys.length && !scheduleOverlap; i++) {
    for (let j = i + 1; j < studentKeys.length; j++) {
      const a = mergedSlots.get(studentKeys[i]) ?? [];
      const b = mergedSlots.get(studentKeys[j]) ?? [];
      if (a.length && b.length && schedulesOverlap(a, b)) {
        scheduleOverlap = true;
        break;
      }
    }
  }

  const { data: trs } = await supabase
    .from("section_transfer_requests")
    .select("student_id, reviewed_at, to_section_id")
    .in("student_id", ids)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(15);

  const toIds = [...new Set((trs ?? []).map((t) => t.to_section_id as string))];
  const toName = new Map<string, string>();
  if (toIds.length) {
    const { data: secs } = await supabase.from("academic_sections").select("id, name").in("id", toIds);
    for (const s of secs ?? []) toName.set(s.id as string, s.name as string);
  }

  const updates: ParentHubUpdateRow[] = (trs ?? [])
    .map((t) => ({
      reviewedAt: t.reviewed_at ? String(t.reviewed_at) : "",
      childFirstName: (nameBy.get(t.student_id as string) ?? "").split(/\s+/)[0] ?? "",
      newSectionName: toName.get(t.to_section_id as string) ?? "",
    }))
    .filter((u) => u.reviewedAt.length > 0);

  const pendingMap = await loadParentPaymentPendingMap(supabase, ids);
  const childPaymentPending: Record<string, boolean> = {};
  for (const id of ids) childPaymentPending[id] = pendingMap.get(id) ?? false;

  const enrollmentRows = (enr ?? []).map((row) => ({
    id: row.id as string,
    student_id: row.student_id as string,
    status: row.status as string,
    section_id: row.section_id as string,
  }));

  const { attendanceLines, attendanceLevelByStudent } = await buildParentHubAttendanceSnapshot(
    supabase,
    ids,
    enrollmentRows,
    nameBy,
    sectionsMeta,
    globalMin,
    sectionMinOverrideBySectionId,
  );

  const activeLines = logisticsRows
    .filter((r) => r.active)
    .map((r) => `${r.childLabel}: ${r.classLabel} — ${r.scheduleHuman}`);
  const icsDocument =
    activeLines.length > 0
      ? buildPlainTextFamilyScheduleIcs({
          title: icsEventTitle,
          body: activeLines.join("\n"),
        })
      : null;

  return {
    logisticsRows,
    scheduleOverlap,
    updates,
    icsDocument,
    childPaymentPending,
    attendanceLines,
    attendanceLevelByStudent,
  };
}
