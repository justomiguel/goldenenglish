"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  requireAdminEventActor,
  revalidateEventFormSurfaces,
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
    .update(
      collectBirthDate
        ? { collect_birth_date: true }
        : { collect_birth_date: false, require_birth_date: false },
    )
    .eq("id", eventId);

  if (error) {
    logSupabaseClientError("updateEventCollectBirthDateAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  if (!collectBirthDate) {
    await recordSystemAudit({
      action: "event_base_field_requirements_updated",
      resourceType: "event",
      resourceId: eventId,
      payload: { require_birth_date: false },
    });
  }

  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}
