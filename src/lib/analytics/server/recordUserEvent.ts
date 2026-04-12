"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserEventTypeName } from "@/lib/analytics/eventConstants";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";

export async function recordUserEventServer(input: {
  userId: string;
  eventType: UserEventTypeName;
  entity: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== input.userId) return { ok: false };

  const meta = sanitizeAnalyticsMetadata(input.metadata ?? {});
  const { error } = await supabase.from("user_events").insert({
    user_id: input.userId,
    event_type: input.eventType,
    entity: input.entity,
    metadata: meta,
  });
  if (error) return { ok: false };
  return { ok: true };
}
