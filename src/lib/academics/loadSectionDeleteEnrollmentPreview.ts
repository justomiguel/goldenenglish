import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  mapSectionDeleteEnrollmentPreview,
  type SectionDeleteEnrollmentPreview,
  type SectionDeleteEnrollmentRaw,
} from "@/lib/academics/mapSectionDeleteEnrollmentPreview";

export type { SectionDeleteEnrollmentPreview };

export async function loadSectionDeleteEnrollmentPreview(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<{ ok: true; enrollments: SectionDeleteEnrollmentPreview[] } | { ok: false }> {
  const { data, error } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles!student_id(first_name,last_name)")
    .eq("section_id", sectionId);

  if (error) {
    logSupabaseClientError("loadSectionDeleteEnrollmentPreview", error, { sectionId });
    return { ok: false };
  }

  return {
    ok: true,
    enrollments: mapSectionDeleteEnrollmentPreview((data ?? []) as SectionDeleteEnrollmentRaw[]),
  };
}
