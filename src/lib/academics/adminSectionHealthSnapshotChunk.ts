import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const ADMIN_SECTION_HEALTH_CHUNK = 120;

export function adminSectionHealthIsoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function countAttendanceByEnrollmentChunk(
  supabase: SupabaseClient,
  enrollmentIds: string[],
  status: "present" | "absent" | "late" | "excused",
  chunkSize: number = ADMIN_SECTION_HEALTH_CHUNK,
): Promise<number> {
  if (enrollmentIds.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < enrollmentIds.length; i += chunkSize) {
    const batch = enrollmentIds.slice(i, i + chunkSize);
    const { count, error } = await supabase
      .from("section_attendance")
      .select("id", { count: "exact", head: true })
      .in("enrollment_id", batch)
      .eq("status", status);
    if (error) {
      logSupabaseClientError("loadAdminSectionHealthSnapshot:attendanceCount", error, { status });
      continue;
    }
    n += count ?? 0;
  }
  return n;
}
