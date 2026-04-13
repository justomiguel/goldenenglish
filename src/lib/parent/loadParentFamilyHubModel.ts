import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ParentHubAttendanceLine,
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
import { sectionAttendanceMonthPresentPct } from "@/lib/academics/sectionAttendanceMonthPct";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

export async function loadParentFamilyHubModel(
  supabase: SupabaseClient,
  tutorId: string,
  locale: string,
  icsEventTitle: string,
): Promise<ParentHubModel> {
  const empty: ParentHubModel = {
    logisticsRows: [],
    scheduleOverlap: false,
    updates: [],
    icsDocument: null,
    childPaymentPending: {},
    attendanceLines: [],
  };

  const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", tutorId);
  const ids = [...new Set((links ?? []).map((l) => l.student_id as string))];
  if (ids.length === 0) return empty;

  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
  const nameBy = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameBy.set(p.id as string, `${p.first_name} ${p.last_name}`.trim());
  }

  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("id, student_id, status, section_id")
    .in("student_id", ids);

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

  const activeEnrollmentIds = (enr ?? [])
    .filter((row) => row.status === "active")
    .map((row) => row.id as string);
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth() + 1;
  const monthStart = `${y}-${String(mo).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);

  let attRows: { enrollment_id: string; attended_on: string; status: string }[] = [];
  if (activeEnrollmentIds.length) {
    const { data: att } = await supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", activeEnrollmentIds)
      .gte("attended_on", monthStart)
      .lte("attended_on", monthEnd);
    attRows = (att ?? []) as { enrollment_id: string; attended_on: string; status: string }[];
  }

  const attendanceLines: ParentHubAttendanceLine[] = [];
  for (const sid of ids) {
    const enrIdsForChild = (enr ?? [])
      .filter((row) => row.student_id === sid && row.status === "active")
      .map((row) => row.id as string);
    if (!enrIdsForChild.length) continue;
    const slice = attRows.filter((r) => enrIdsForChild.includes(r.enrollment_id));
    const pct = sectionAttendanceMonthPresentPct(
      slice.map((r) => ({ attended_on: r.attended_on, status: r.status })),
      y,
      mo,
    );
    if (pct == null) continue;
    const childFirstName = (nameBy.get(sid) ?? "").split(/\s+/)[0] ?? "";
    attendanceLines.push({ studentId: sid, childFirstName, pct });
  }

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
  };
}
