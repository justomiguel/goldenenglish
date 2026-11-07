import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

async function countAttendees(
  admin: SupabaseClient,
  eventId: string,
  status: "confirmed" | "pending_payment",
): Promise<number> {
  const { count, error } = await admin
    .from("event_attendees")
    .select("id", { head: true, count: "exact" })
    .eq("event_id", eventId)
    .eq("status", status);
  if (error) {
    logSupabaseClientError("loadEventOccupyingCounts", error, { eventId, status });
    return 0;
  }
  return count ?? 0;
}

/** Seats the enroll RPC treats as taken: confirmed plus pending payment. */
export async function loadEventOccupyingCounts(
  admin: SupabaseClient,
  eventId: string,
): Promise<{ confirmed: number; pending: number }> {
  const [confirmed, pending] = await Promise.all([
    countAttendees(admin, eventId, "confirmed"),
    countAttendees(admin, eventId, "pending_payment"),
  ]);
  return { confirmed, pending };
}
