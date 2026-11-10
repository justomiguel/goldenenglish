"use server";

import { revalidatePath } from "next/cache";
import { closeGrantsForEvent, eventShareGrantClient } from "@/lib/events/server/eventShareGrantStore";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { openEventWrite } from "@/app/[locale]/dashboard/admin/events/eventWriteClient";
import {
  adminEventsPath,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function publishEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const opened = await openEventWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const admin = opened.client;
  const { error } = await admin
    .from("events")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}

export async function unpublishEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const opened = await openEventWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const admin = opened.client;
  const { error } = await admin.from("events").update({ status: "draft" }).eq("id", eventId);
  if (error) {
    logSupabaseClientError("unpublishEventAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}

export async function archiveEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const opened = await openEventWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const admin = opened.client;
  const { error } = await admin
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) return { ok: false, message: error.message };
  await closeGrantsForEvent(eventShareGrantClient(), {
    ownerSlug: opened.ownerSlug,
    ownerEventId: eventId,
  });
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}
