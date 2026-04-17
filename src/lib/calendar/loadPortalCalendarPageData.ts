import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalCalendarTeacherOption } from "@/types/portalCalendar";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { pgDateToInputValue } from "@/lib/academics/pgDateToInputValue";
import type { ExamOccurrenceInput, SectionOccurrenceInput } from "@/lib/calendar/expandPortalCalendarOccurrences";

export type PortalCalendarPageRole = "teacher" | "student" | "parent" | "admin";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

type SectionRow = {
  id: string;
  name: string;
  cohort_id: string;
  teacher_id: string;
  schedule_slots: unknown;
  starts_on: unknown;
  ends_on: unknown;
  room_label?: string | null;
  academic_cohorts: CohortCell;
};

function toSectionInput(r: SectionRow): SectionOccurrenceInput | null {
  const slots = parseSectionScheduleSlots(r.schedule_slots);
  if (!slots.length) return null;
  const startsOn = pgDateToInputValue(r.starts_on) ?? "";
  const endsOn = pgDateToInputValue(r.ends_on) ?? startsOn;
  if (!startsOn || !endsOn) return null;
  const cn = cohortName(r.academic_cohorts);
  const title = cn ? `${cn} — ${r.name}` : r.name;
  return {
    sectionId: r.id,
    cohortId: r.cohort_id,
    cohortLabel: cn,
    teacherId: r.teacher_id,
    roomLabel: r.room_label ?? null,
    title,
    startsOn,
    endsOn,
    scheduleSlots: slots,
  };
}

async function loadSectionRowsByIds(supabase: SupabaseClient, ids: string[]): Promise<SectionRow[]> {
  if (!ids.length) return [];
  return chunkedIn<SectionRow>(
    supabase,
    "academic_sections",
    "id",
    ids,
    "id, name, cohort_id, teacher_id, schedule_slots, starts_on, ends_on, room_label, academic_cohorts(name)",
  );
}

export async function loadPortalCalendarPageData(
  supabase: SupabaseClient,
  ctx: {
    role: PortalCalendarPageRole;
    userId: string;
    adminTeacherId?: string | null;
    adminRoom?: string | null;
  },
): Promise<{
  sections: SectionOccurrenceInput[];
  exams: ExamOccurrenceInput[];
  teacherOptions: PortalCalendarTeacherOption[];
  roomOptions: string[];
  viewerSectionIds: string[];
  viewerCohortIds: string[];
}> {
  const empty = {
    sections: [] as SectionOccurrenceInput[],
    exams: [] as ExamOccurrenceInput[],
    teacherOptions: [],
    roomOptions: [],
    viewerSectionIds: [] as string[],
    viewerCohortIds: [] as string[],
  };

  let sectionIds: string[] = [];
  let parentContext: {
    studentIds: string[];
    enr: { student_id: string; section_id: string }[];
    nameBy: Map<string, string>;
  } | null = null;

  if (ctx.role === "teacher") {
    sectionIds = await loadTeacherSectionIdsForUser(supabase, ctx.userId);
  } else if (ctx.role === "student") {
    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("section_id")
      .eq("student_id", ctx.userId)
      .eq("status", "active")
      .limit(400);
    sectionIds = [...new Set((enr ?? []).map((r) => r.section_id as string))];
  } else if (ctx.role === "parent") {
    const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", ctx.userId);
    const studentIds = [...new Set((links ?? []).map((l) => l.student_id as string))];
    if (!studentIds.length) return empty;
    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("student_id, section_id")
      .in("student_id", studentIds)
      .eq("status", "active")
      .limit(800);
    sectionIds = [...new Set((enr ?? []).map((r) => r.section_id as string))];
    const nameBy = await loadStudentDisplayNames(supabase, studentIds);
    parentContext = { studentIds, enr: (enr ?? []) as { student_id: string; section_id: string }[], nameBy };
  } else {
    let q = supabase
      .from("academic_sections")
      .select(
        "id, name, cohort_id, teacher_id, schedule_slots, starts_on, ends_on, room_label, academic_cohorts(name)",
      )
      .is("archived_at", null)
      .limit(800);
    const tid = ctx.adminTeacherId?.trim();
    if (tid) q = q.eq("teacher_id", tid);
    const room = ctx.adminRoom?.trim();
    if (room) q = q.eq("room_label", room);
    const { data: secs } = await q;
    const rows = (secs ?? []) as SectionRow[];
    const inputs = rows.map(toSectionInput).filter(Boolean) as SectionOccurrenceInput[];
    const cohortIds = [...new Set(inputs.map((s) => s.cohortId))];
    const exams = await loadExamsForCohorts(supabase, cohortIds, inputs);
    const teacherOptions = await buildTeacherOptions(supabase, rows);
    const roomOptions = [...new Set(rows.map((r) => r.room_label).filter((x): x is string => Boolean(x?.trim())))].sort();
    const viewerSectionIds = inputs.map((s) => s.sectionId);
    const viewerCohortIds = [...new Set(inputs.map((s) => s.cohortId))];
    return { sections: inputs, exams, teacherOptions, roomOptions, viewerSectionIds, viewerCohortIds };
  }

  const rows = await loadSectionRowsByIds(supabase, sectionIds);
  let inputs = rows.map(toSectionInput).filter(Boolean) as SectionOccurrenceInput[];

  if (ctx.role === "parent" && parentContext) {
    const { enr, nameBy } = parentContext;
    const sectionToStudents = new Map<string, Set<string>>();
    for (const r of enr) {
      const sid = r.section_id;
      const st = r.student_id;
      if (!sectionToStudents.has(sid)) sectionToStudents.set(sid, new Set());
      sectionToStudents.get(sid)!.add(st);
    }
    inputs = inputs
      .map((sec) => {
        const studs = sectionToStudents.get(sec.sectionId);
        if (!studs || studs.size === 0) return null;
        const labels = [...studs].map((id) => nameBy.get(id) ?? "").filter(Boolean);
        if (!labels.length) return sec;
        const childPart = labels.length === 1 ? labels[0]! : labels.join(" / ");
        return { ...sec, title: `[${childPart}] - ${sec.title}` };
      })
      .filter(Boolean) as SectionOccurrenceInput[];
  }

  const cohortIds = [...new Set(inputs.map((s) => s.cohortId))];
  let exams = await loadExamsForCohorts(supabase, cohortIds, inputs);
  if (ctx.role === "parent" && parentContext) {
    const sectionCohort = new Map(rows.map((r) => [r.id, r.cohort_id]));
    const cohortToChildIds = new Map<string, Set<string>>();
    for (const r of parentContext.enr) {
      const cid = sectionCohort.get(r.section_id);
      if (!cid) continue;
      if (!cohortToChildIds.has(cid)) cohortToChildIds.set(cid, new Set());
      cohortToChildIds.get(cid)!.add(r.student_id);
    }
    exams = exams.map((ex) => {
      const ids = cohortToChildIds.get(ex.cohortId);
      if (!ids || ids.size === 0) return ex;
      const labels = [...ids].map((id) => parentContext!.nameBy.get(id) ?? "").filter(Boolean);
      if (!labels.length) return ex;
      const childPart = labels.length === 1 ? labels[0]! : labels.join(" / ");
      return { ...ex, title: `[${childPart}] - ${ex.title}` };
    });
  }
  const viewerSectionIds = [...sectionIds];
  const viewerCohortIds = [...new Set(rows.map((r) => r.cohort_id))];
  return { sections: inputs, exams, teacherOptions: [], roomOptions: [], viewerSectionIds, viewerCohortIds };
}

async function loadStudentDisplayNames(supabase: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ids.length) return out;
  const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
  for (const p of profs ?? []) {
    out.set(p.id as string, `${(p.first_name as string) ?? ""} ${(p.last_name as string) ?? ""}`.trim());
  }
  return out;
}

async function loadExamsForCohorts(
  supabase: SupabaseClient,
  cohortIds: string[],
  sectionInputs: SectionOccurrenceInput[],
): Promise<ExamOccurrenceInput[]> {
  if (!cohortIds.length) return [];
  const { data: asm } = await supabase
    .from("cohort_assessments")
    .select("id, cohort_id, name, assessment_on")
    .in("cohort_id", cohortIds)
    .order("assessment_on", { ascending: true })
    .limit(400);
  const cohortTitle = new Map<string, string>();
  for (const s of sectionInputs) {
    if (!cohortTitle.has(s.cohortId)) cohortTitle.set(s.cohortId, s.cohortLabel || s.title);
  }
  return (asm ?? []).map((a) => {
    const cid = a.cohort_id as string;
    const cn = cohortTitle.get(cid) ?? "";
    const nm = a.name as string;
    const title = cn ? `${cn} — ${nm}` : nm;
    return {
      assessmentId: a.id as string,
      cohortId: cid,
      title,
      assessmentOn: pgDateToInputValue(a.assessment_on) ?? "",
    };
  });
}

async function buildTeacherOptions(supabase: SupabaseClient, rows: SectionRow[]): Promise<PortalCalendarTeacherOption[]> {
  const tids = [...new Set(rows.map((r) => r.teacher_id))];
  if (!tids.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name").in("id", tids);
  const out: PortalCalendarTeacherOption[] = [];
  for (const p of profs ?? []) {
    const label = `${(p.first_name as string) ?? ""} ${(p.last_name as string) ?? ""}`.trim();
    out.push({ id: p.id as string, label: label || (p.id as string) });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
