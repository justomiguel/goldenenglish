"use server";

import { revalidatePath } from "next/cache";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { duplicateEventServer } from "@/lib/events/server/duplicateEventServer";
import { openEventWrite } from "@/app/[locale]/dashboard/admin/events/eventWriteClient";
import {
  adminEventsPath,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function duplicateEventAction(input: {
  locale: string;
  eventId: string;
}): Promise<EventMutationResult> {
  const opened = await openEventWrite(input.eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  let actorId = opened.actorId;
  if (opened.access === "guest") {
    const { data: ownerAdmin } = await opened.client
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (!ownerAdmin?.id) return { ok: false, message: "share_store_failed" };
    actorId = String(ownerAdmin.id);
  }
  const result = await duplicateEventServer(opened.client, {
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
