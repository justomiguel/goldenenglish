import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { schedulesOverlap } from "@/lib/academics/detectScheduleOverlap";

export type PreviewStudentAssistantScheduleResult =
  | { ok: true }
  | { ok: false; code: "PARSE" | "SCHEDULE_OVERLAP" };

type SectionRow = {
  schedule_slots: unknown;
};

/**
 * When a student is listed as an in-portal assistant, their other active class
 * schedules must not overlap the assisted section's slots (same section enrollment excluded).
 */
export async function previewStudentAssistantScheduleConflicts(
  supabase: SupabaseClient,
  input: { sectionId: string; studentProfileId: string },
): Promise<PreviewStudentAssistantScheduleResult> {
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", input.studentProfileId)
    .maybeSingle();
  if (pErr || !prof) return { ok: false, code: "PARSE" };
  if ((prof as { role: string }).role !== "student") return { ok: true };

  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, schedule_slots, archived_at")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (secErr || !section) return { ok: false, code: "PARSE" };
  if ((section as { archived_at?: string | null }).archived_at != null) {
    return { ok: false, code: "PARSE" };
  }

  const targetSlots = parseSectionScheduleSlots((section as SectionRow).schedule_slots);
  if (targetSlots.length === 0) return { ok: true };

  const { data: activeRows, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("section_id")
    .eq("student_id", input.studentProfileId)
    .eq("status", "active");
  if (enrErr || !activeRows) return { ok: false, code: "PARSE" };

  const otherSectionIds = [
    ...new Set(
      activeRows
        .map((r) => (r as { section_id: string }).section_id)
        .filter((sid) => sid !== input.sectionId),
    ),
  ];
  if (otherSectionIds.length === 0) return { ok: true };

  const { data: otherSections, error: osErr } = await supabase
    .from("academic_sections")
    .select("id, schedule_slots")
    .in("id", otherSectionIds)
    .is("archived_at", null);
  if (osErr || !otherSections) return { ok: false, code: "PARSE" };

  for (const s of otherSections as SectionRow[]) {
    const otherSlots = parseSectionScheduleSlots(s.schedule_slots);
    if (schedulesOverlap(targetSlots, otherSlots)) return { ok: false, code: "SCHEDULE_OVERLAP" };
  }
  return { ok: true };
}
