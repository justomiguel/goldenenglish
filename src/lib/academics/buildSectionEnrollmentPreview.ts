import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PreviewSectionEnrollmentResult,
  SectionEnrollmentConflict,
} from "@/types/academics";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { schedulesOverlap } from "@/lib/academics/detectScheduleOverlap";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { loadParentPaymentPendingForStudent } from "@/lib/academics/parentPaymentPending";

type SectionHead = {
  id: string;
  name: string;
  schedule_slots: unknown;
  max_students: number | null;
  academic_cohorts: { name: string } | { name: string }[] | null;
};

function cohortNameFromSection(s: SectionHead): string {
  const c = s.academic_cohorts;
  if (!c) return "";
  return Array.isArray(c) ? (c[0]?.name ?? "") : c.name;
}

export async function buildSectionEnrollmentPreview(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    sectionId: string;
    ignoreEnrollmentId?: string | null;
    /** When true, capacity over max does not fail preview (admin explicit override path). */
    ignoreCapacity?: boolean;
  },
): Promise<PreviewSectionEnrollmentResult> {
  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, name, schedule_slots, max_students, academic_cohorts(name)")
    .eq("id", input.sectionId)
    .maybeSingle();

  if (secErr || !section) {
    return { ok: false, code: "PARSE" };
  }

  const row = section as unknown as SectionHead;
  const targetSlots = parseSectionScheduleSlots(row.schedule_slots);
  if (targetSlots.length === 0) {
    return { ok: false, code: "PARSE" };
  }

  const defMax = getDefaultSectionMaxStudents();
  const maxStudents = row.max_students ?? defMax;

  const { count, error: cntErr } = await supabase
    .from("section_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("section_id", input.sectionId)
    .eq("status", "active");

  if (cntErr) return { ok: false, code: "PARSE" };
  const activeCount = count ?? 0;
  if (!input.ignoreCapacity && activeCount >= maxStudents) {
    return {
      ok: false,
      code: "CAPACITY_EXCEEDED",
      activeCount,
      maxStudents,
      targetSlots,
    };
  }

  const { data: activeRows, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, section_id")
    .eq("student_id", input.studentId)
    .eq("status", "active");

  if (enrErr) return { ok: false, code: "PARSE" };

  const ids = (activeRows ?? [])
    .filter((r) => !input.ignoreEnrollmentId || r.id !== input.ignoreEnrollmentId)
    .map((r) => r.section_id as string);

  if (ids.includes(input.sectionId)) {
    return { ok: false, code: "ALREADY_ACTIVE", targetSlots };
  }

  const uniqueSectionIds = [...new Set(ids)];
  if (uniqueSectionIds.length === 0) {
    const parentPaymentsPending = await loadParentPaymentPendingForStudent(supabase, input.studentId);
    return { ok: true, parentPaymentsPending };
  }

  const { data: otherSections, error: osErr } = await supabase
    .from("academic_sections")
    .select("id, name, schedule_slots, academic_cohorts(name)")
    .in("id", uniqueSectionIds);

  if (osErr || !otherSections) return { ok: false, code: "PARSE" };

  const conflicts: SectionEnrollmentConflict[] = [];
  for (const s of otherSections as unknown as SectionHead[]) {
    const otherSlots = parseSectionScheduleSlots(s.schedule_slots);
    if (schedulesOverlap(targetSlots, otherSlots)) {
      const enrId = (activeRows ?? []).find((e) => e.section_id === s.id)?.id ?? "";
      conflicts.push({
        enrollmentId: enrId,
        sectionId: s.id,
        sectionName: s.name,
        cohortName: cohortNameFromSection(s),
        scheduleSlots: otherSlots,
      });
    }
  }

  const parentPaymentsPending = await loadParentPaymentPendingForStudent(supabase, input.studentId);

  if (conflicts.length > 0) {
    return {
      ok: false,
      code: "SCHEDULE_OVERLAP",
      conflicts,
      targetSlots,
      parentPaymentsPending,
    };
  }

  return { ok: true, parentPaymentsPending };
}

