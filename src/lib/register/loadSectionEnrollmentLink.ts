import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import {
  isSectionEnrollmentLinkToken,
  type SectionEnrollmentLinkContext,
} from "@/lib/register/sectionEnrollmentLink";

type ResolvedRow = {
  section_id?: string | null;
  section_name?: string | null;
  cohort_name?: string | null;
  schedule_slots?: unknown;
  seats_remaining?: number | null;
  reference_image_path?: string | null;
};

/**
 * Resolves a public enrollment link token (safe for unauthenticated visitors).
 * Returns null for every unusable case — malformed, unknown, rotated, deactivated
 * or archived — so the page renders one "no longer available" state.
 */
export async function loadSectionEnrollmentLink(
  token: string,
): Promise<SectionEnrollmentLinkContext | null> {
  if (!isSectionEnrollmentLinkToken(token)) return null;
  const supabase = createAnonReadOnlyClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("resolve_section_enrollment_link", {
    p_token: token,
  });
  if (error) return null;

  const row = (Array.isArray(data) ? data[0] : data) as ResolvedRow | null | undefined;
  if (!row?.section_id || !row.section_name) return null;

  const seats = row.seats_remaining;
  return {
    token,
    sectionId: String(row.section_id),
    sectionName: String(row.section_name),
    cohortName: row.cohort_name ? String(row.cohort_name) : "",
    scheduleSlots: parseSectionScheduleSlots(row.schedule_slots),
    seatsRemaining: typeof seats === "number" ? seats : null,
    referenceImagePath:
      typeof row.reference_image_path === "string" && row.reference_image_path.trim()
        ? row.reference_image_path.trim()
        : null,
  };
}
