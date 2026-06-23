"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

const updateCollectBirthDateSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  collectBirthDate: z.boolean(),
});

export async function updateEventCollectBirthDateAction(
  raw: unknown,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = updateCollectBirthDateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, collectBirthDate } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ collect_birth_date: collectBirthDate })
    .eq("id", eventId);

  if (error) {
    logSupabaseClientError("updateEventCollectBirthDateAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  const { data: slugRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle();
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  if (slugRow?.slug) {
    const slug = String(slugRow.slug);
    revalidatePath(`/${locale}/events/${slug}`, "page");
    revalidatePath(`/${locale}/events/${slug}/register`, "page");
  }
  return { ok: true };
}
