"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  countEventSeatMapCapacity,
  sanitizeEventSeatMapConfig,
} from "@/lib/events/seatMapModel";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function saveEventSeatMapConfigAction(input: {
  locale: string;
  eventId: string;
  seatMapConfig: unknown;
  syncCapacity?: boolean;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const sanitized = sanitizeEventSeatMapConfig(input.seatMapConfig);
  if (!sanitized) return { ok: false, message: "validation" };

  const admin = await createAdminClient();
  const patch: Record<string, unknown> = {
    seat_map_config: sanitized,
    updated_at: new Date().toISOString(),
  };

  const counts = countEventSeatMapCapacity(sanitized);
  if (input.syncCapacity && sanitized.enabled && counts.purchasableSeats > 0) {
    patch.capacity = counts.purchasableSeats;
  }

  const { error } = await admin
    .from("events")
    .update(patch)
    .eq("id", input.eventId);

  if (error) {
    logSupabaseClientError("saveEventSeatMapConfigAction:update", error, {
      eventId: input.eventId,
    });
    return { ok: false, message: error.message };
  }

  await recordSystemAudit({
    action: "event_seat_map_updated",
    resourceType: "event",
    resourceId: input.eventId,
    payload: {
      enabled: sanitized.enabled,
      floorCount: sanitized.floors.length,
      purchasableSeats: counts.purchasableSeats,
      syncCapacity: Boolean(input.syncCapacity),
    },
  });

  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
  revalidatePath(`/${input.locale}/events`, "layout");
  return { ok: true };
}
