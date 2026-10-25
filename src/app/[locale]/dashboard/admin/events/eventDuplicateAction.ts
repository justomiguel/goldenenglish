"use server";

import { revalidatePath } from "next/cache";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { createAdminClient } from "@/lib/supabase/admin";
import { duplicateEventServer } from "@/lib/events/server/duplicateEventServer";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function duplicateEventAction(input: {
  locale: string;
  eventId: string;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const result = await duplicateEventServer(await createAdminClient(), {
    eventId: input.eventId,
    actorId,
  });
  if (!result.ok) return { ok: false, message: result.code };
  await recordSystemAudit({
    action: "event.duplicate",
    resourceType: "event",
    resourceId: result.eventId,
    payload: { sourceEventId: input.eventId },
  });
  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/${result.eventId}`, "page");
  return { ok: true, eventId: result.eventId };
}
