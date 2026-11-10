import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export async function stampEventAttendeeEntryHost(
  admin: SupabaseClient,
  input: { attendeeId: string | null; access: string },
): Promise<void> {
  if (!input.attendeeId || input.access !== "guest") return;
  const tenant = await resolveRequestTenant();
  if (!tenant?.slug) return;
  const { error } = await admin
    .from("event_attendees")
    .update({ entry_host_slug: tenant.slug })
    .eq("id", input.attendeeId);
  if (error) {
    logSupabaseClientError("enrollEventAttendeeServer:entryHost", error, {
      attendeeId: input.attendeeId,
      code: "share_store_failed",
    });
  }
}
