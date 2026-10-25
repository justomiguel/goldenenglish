"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { locales } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

const updateShowOnHomeSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  showOnHome: z.boolean(),
});

export async function updateEventShowOnHomeAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = updateShowOnHomeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, showOnHome } = parsed.data;
  const admin = await createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ show_on_home: showOnHome })
    .eq("id", eventId);

  if (error) {
    logSupabaseClientError("updateEventShowOnHomeAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  await recordSystemAudit({
    action: "event_show_on_home_updated",
    resourceType: "event",
    resourceId: eventId,
    payload: { show_on_home: showOnHome },
  });

  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  for (const loc of locales) {
    revalidatePath(`/${loc}`, "page");
  }
  return { ok: true };
}
