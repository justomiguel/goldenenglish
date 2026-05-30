import type { SupabaseClient } from "@supabase/supabase-js";
import { incrementContentViewCount } from "@/lib/analytics/server/incrementContentViewCount";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface IncrementEventViewCountInput {
  eventId: string;
  entity: string;
  userId?: string | null;
  sessionKey?: string | null;
}

async function incrementEventStoredCount(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("increment_event_view_count", {
    p_event_id: eventId,
  });
  if (!error) return true;

  const { data: row, error: readError } = await supabase
    .from("events")
    .select("view_count")
    .eq("id", eventId);
  if (readError || !row?.[0]) {
    logSupabaseClientError("events.increment_view.read", readError, { eventId });
    return false;
  }

  const fallback = await supabase
    .from("events")
    .update({ view_count: Number(row[0].view_count ?? 0) + 1 })
    .eq("id", eventId);
  if (fallback.error) {
    logSupabaseClientError("events.increment_view.update", fallback.error, { eventId });
    return false;
  }

  return true;
}

export async function incrementEventViewCount(
  supabase: SupabaseClient,
  input: IncrementEventViewCountInput,
): Promise<{ ok: boolean; deduped: boolean }> {
  return incrementContentViewCount(supabase, {
    resourceId: input.eventId,
    entity: input.entity,
    kind: "event_view",
    userId: input.userId,
    sessionKey: input.sessionKey,
    logScope: "events.increment_view",
    incrementStoredCount: (client) => incrementEventStoredCount(client, input.eventId),
  });
}
