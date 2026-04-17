import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SCOPE = "loadAdminSpecialEventScopeOptions" as const;

export type AdminSpecialCohortOption = { id: string; name: string };
export type AdminSpecialSectionOption = { id: string; name: string; cohort_id: string };

export async function loadAdminSpecialEventScopeOptions(supabase: SupabaseClient): Promise<{
  cohorts: AdminSpecialCohortOption[];
  sections: AdminSpecialSectionOption[];
}> {
  const [cohRes, secRes] = await Promise.all([
    supabase.from("academic_cohorts").select("id, name").is("archived_at", null).order("name").limit(200),
    supabase.from("academic_sections").select("id, name, cohort_id").is("archived_at", null).order("name").limit(800),
  ]);
  if (cohRes.error) logSupabaseClientError(`${SCOPE}:cohorts`, cohRes.error, {});
  if (secRes.error) logSupabaseClientError(`${SCOPE}:sections`, secRes.error, {});
  const cohorts = (cohRes.data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
  const sections = (secRes.data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    cohort_id: r.cohort_id as string,
  }));
  return { cohorts, sections };
}
