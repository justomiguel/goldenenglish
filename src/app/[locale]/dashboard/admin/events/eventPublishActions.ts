"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function publishEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = await createAdminClient();
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
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = await createAdminClient();
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
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = await createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}
