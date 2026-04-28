import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { SECTION_LEAD_TEACHER_ELIGIBLE_ROLES } from "@/lib/academics/sectionStaffEligibleRoles";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface AdminCohortSectionRow {
  id: string;
  name: string;
  active: number;
  max: number;
  archivedAt: string | null;
  periodLine?: string;
}

export interface AdminCohortMoveTarget {
  id: string;
  label: string;
  cohortId: string;
}

export interface AdminCohortPageData {
  sectionRows: AdminCohortSectionRow[];
  distinctActiveStudents: number;
  targetOptions: AdminCohortMoveTarget[];
  sourceSectionOptions: { id: string; name: string }[];
  teachers: { id: string; label: string }[];
  copySourceOptions: { id: string; label: string }[];
  defaultSectionMaxStudents: number;
}

async function loadSectionRows(
  supabase: SupabaseClient,
  cohortId: string,
  locale: string,
  defMax: number,
): Promise<AdminCohortSectionRow[]> {
  const { data: sections } = await supabase
    .from("academic_sections")
    .select("id, name, max_students, teacher_id, archived_at, starts_on, ends_on")
    .eq("cohort_id", cohortId)
    .order("name");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return Promise.all(
    (sections ?? []).map(async (s) => {
      const sid = s.id as string;
      const { count } = await supabase
        .from("section_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("section_id", sid)
        .eq("status", "active");
      const max = (s.max_students as number | null) ?? defMax;
      const startsOn = (s as { starts_on?: string | null }).starts_on ?? null;
      const endsOn = (s as { ends_on?: string | null }).ends_on ?? null;
      let periodLine: string | undefined;
      if (startsOn && endsOn) {
        const a = `${startsOn}T12:00:00Z`;
        const b = `${endsOn}T12:00:00Z`;
        periodLine = `${dateFmt.format(new Date(a))} – ${dateFmt.format(new Date(b))}`;
      }
      return {
        id: sid,
        name: s.name as string,
        active: count ?? 0,
        max,
        archivedAt: (s as { archived_at?: string | null }).archived_at ?? null,
        periodLine,
      };
    }),
  );
}

async function loadDistinctActiveStudents(
  supabase: SupabaseClient,
  sectionIds: string[],
): Promise<number> {
  if (sectionIds.length === 0) return 0;
  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("student_id")
    .in("section_id", sectionIds)
    .eq("status", "active");
  return new Set(
    (enr ?? []).map((e) => (e as { student_id: string }).student_id),
  ).size;
}

async function loadMoveTargetOptions(
  supabase: SupabaseClient,
): Promise<AdminCohortMoveTarget[]> {
  const { data: allSectionsRaw } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, archived_at, academic_cohorts(name, archived_at)")
    .order("name")
    .limit(500);
  return (allSectionsRaw ?? [])
    .map((raw) => {
      const r = raw as {
        id: string;
        name: string;
        cohort_id: string;
        archived_at: string | null;
        academic_cohorts:
          | { name: string; archived_at?: string | null }
          | { name: string; archived_at?: string | null }[]
          | null;
      };
      const c = r.academic_cohorts;
      const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      const cohortArch = Array.isArray(c) ? (c[0]?.archived_at ?? null) : (c?.archived_at ?? null);
      return {
        id: r.id,
        label: `${cn} — ${r.name}`,
        cohortId: r.cohort_id,
        sectionArchived: r.archived_at != null,
        cohortArchived: cohortArch != null,
      };
    })
    .filter((o) => !o.sectionArchived && !o.cohortArchived)
    .map(({ id, label, cohortId }) => ({ id, label, cohortId }));
}

async function loadTeachers(supabase: SupabaseClient): Promise<{ id: string; label: string }[]> {
  const { data: teacherRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("role", [...SECTION_LEAD_TEACHER_ELIGIBLE_ROLES])
    .order("last_name", { ascending: true })
    .limit(200);
  return (teacherRows ?? []).map((p) => {
    const r = p as { id: string; first_name: string; last_name: string };
    return { id: r.id, label: formatProfileSnakeSurnameFirst(r) };
  });
}

async function loadCopySourceOptions(
  supabase: SupabaseClient,
  cohortId: string,
): Promise<{ id: string; label: string }[]> {
  const { data: otherCohorts } = await supabase
    .from("academic_cohorts")
    .select("id, name")
    .neq("id", cohortId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return (otherCohorts ?? []).map((c) => ({
    id: c.id as string,
    label: c.name as string,
  }));
}

export async function loadAdminCohortPageData(
  supabase: SupabaseClient,
  cohortId: string,
  locale: string,
): Promise<AdminCohortPageData> {
  const defMax = getDefaultSectionMaxStudents();
  const sectionRows = await loadSectionRows(supabase, cohortId, locale, defMax);
  const sectionIds = sectionRows.map((r) => r.id);
  const [
    distinctActiveStudents,
    targetOptions,
    teachers,
    copySourceOptions,
  ] = await Promise.all([
    loadDistinctActiveStudents(supabase, sectionIds),
    loadMoveTargetOptions(supabase),
    loadTeachers(supabase),
    loadCopySourceOptions(supabase, cohortId),
  ]);
  return {
    sectionRows,
    distinctActiveStudents,
    targetOptions,
    sourceSectionOptions: sectionRows.map((r) => ({ id: r.id, name: r.name })),
    teachers,
    copySourceOptions,
    defaultSectionMaxStudents: defMax,
  };
}
