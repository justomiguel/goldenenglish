import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const S = "loadSectionMinAttendanceOverrides" as const;
const CHUNK_SIZE = 200;

/**
 * Per-section parent attendance targets. Returns an empty map when the column
 * is not migrated yet or the query fails — callers fall back to site default.
 */
export async function loadSectionMinAttendanceOverrides(
  supabase: SupabaseClient,
  sectionIds: string[],
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  const unique = [...new Set(sectionIds.filter(Boolean))];
  if (unique.length === 0) return map;

  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    const batch = unique.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("academic_sections")
      .select("id, min_attendance_percent")
      .in("id", batch);

    if (error) {
      logSupabaseClientError(S, error, { sectionCount: unique.length });
      return map;
    }

    for (const row of data ?? []) {
      const raw = row.min_attendance_percent as number | null;
      map.set(
        row.id as string,
        raw != null && Number.isFinite(raw) ? Math.trunc(raw) : null,
      );
    }
  }

  return map;
}
