import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseCefrLevelFromInterest,
  resolveCourseIdFromLevelInterest,
} from "@/lib/import/bulkImportEnrollment";

type CohortNameCell = { name?: string } | { name?: string }[] | null | undefined;

function cohortNameFromJoin(raw: CohortNameCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : String(raw.name ?? "");
}

/**
 * Resolves a course id when accepting a registration: prefers section-backed CEFR from
 * `preferred_section_id` + cohort/section names; falls back to legacy `level_interest` string.
 */
export async function resolveCourseIdForRegistrationAccept(
  admin: SupabaseClient,
  params: {
    preferredSectionId: string | null | undefined;
    levelInterestFallback: string | null | undefined;
  },
): Promise<string | null> {
  const sid = params.preferredSectionId?.trim();
  if (sid) {
    const { data: row, error } = await admin
      .from("academic_sections")
      .select("name, academic_cohorts(name)")
      .eq("id", sid)
      .maybeSingle();

    if (!error && row && typeof row === "object") {
      const sectionName = String(
        (row as { name?: unknown }).name ?? "",
      ).trim();
      const cohortName = cohortNameFromJoin(
        (row as { academic_cohorts?: CohortNameCell }).academic_cohorts,
      ).trim();
      const candidates = [
        `${cohortName} ${sectionName}`.trim(),
        sectionName,
        cohortName,
      ].filter((s) => s.length > 0);
      for (const c of candidates) {
        if (parseCefrLevelFromInterest(c)) {
          return resolveCourseIdFromLevelInterest(admin, c);
        }
      }
    }
  }
  return resolveCourseIdFromLevelInterest(
    admin,
    params.levelInterestFallback ?? null,
  );
}
