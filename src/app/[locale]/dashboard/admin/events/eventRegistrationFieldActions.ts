"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { retainHiddenBirthDateToken } from "@/lib/events/registrationFieldOrder";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAdminEventActor,
  revalidateEventFormSurfaces,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

const tokenSchema = z.string().regex(
  /^(base:(firstName|lastName|dniOrPassport|email|phone|birthDate)|field:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
);

const orderSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  order: z.array(tokenSchema).max(80),
});

const requirementsSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  requirePhone: z.boolean(),
  requireBirthDate: z.boolean(),
});

export async function updateEventRegistrationFieldOrderAction(
  raw: unknown,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, order } = parsed.data;
  const admin = createAdminClient();
  const fieldIds = [
    ...new Set(order.filter((token) => token.startsWith("field:")).map((token) => token.slice(6))),
  ];

  if (fieldIds.length > 0) {
    const { data: fieldRows, error: fieldError } = await admin
      .from("event_form_fields")
      .select("id")
      .eq("event_id", eventId)
      .is("archived_at", null)
      .in("id", fieldIds);
    if (fieldError) {
      logSupabaseClientError("updateEventRegistrationFieldOrderAction:fields", fieldError, { eventId });
      return { ok: false, message: "save_failed" };
    }
    const found = new Set((fieldRows ?? []).map((row) => String(row.id)));
    if (fieldIds.some((id) => !found.has(id))) return { ok: false, message: "validation_failed" };
  }

  const { data: eventRow, error: readError } = await admin
    .from("events")
    .select("registration_field_order, collect_birth_date")
    .eq("id", eventId)
    .maybeSingle();
  if (readError) {
    logSupabaseClientError("updateEventRegistrationFieldOrderAction:read", readError, { eventId });
    return { ok: false, message: "save_failed" };
  }
  if (!eventRow) return { ok: false, message: "validation_failed" };

  const previous = Array.isArray(eventRow.registration_field_order)
    ? eventRow.registration_field_order.map((token) => String(token))
    : [];
  const next = retainHiddenBirthDateToken(previous, order, Boolean(eventRow.collect_birth_date));

  const { error } = await admin
    .from("events")
    .update({ registration_field_order: next })
    .eq("id", eventId);
  if (error) {
    logSupabaseClientError("updateEventRegistrationFieldOrderAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  await recordSystemAudit({
    action: "event_registration_field_order_updated",
    resourceType: "event",
    resourceId: eventId,
    payload: { registration_field_order: next },
  });
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function updateEventBaseFieldRequirementsAction(
  raw: unknown,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = requirementsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, requirePhone, requireBirthDate } = parsed.data;
  const admin = createAdminClient();
  const { data: eventRow, error: readError } = await admin
    .from("events")
    .select("collect_birth_date")
    .eq("id", eventId)
    .maybeSingle();
  if (readError) {
    logSupabaseClientError("updateEventBaseFieldRequirementsAction:read", readError, { eventId });
    return { ok: false, message: "save_failed" };
  }
  if (!eventRow) return { ok: false, message: "validation_failed" };
  if (requireBirthDate && !eventRow.collect_birth_date) {
    return { ok: false, message: "validation_failed" };
  }

  const nextBirthDate = Boolean(eventRow.collect_birth_date) && requireBirthDate;
  const { error } = await admin
    .from("events")
    .update({ require_phone: requirePhone, require_birth_date: nextBirthDate })
    .eq("id", eventId);
  if (error) {
    logSupabaseClientError("updateEventBaseFieldRequirementsAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  await recordSystemAudit({
    action: "event_base_field_requirements_updated",
    resourceType: "event",
    resourceId: eventId,
    payload: { require_phone: requirePhone, require_birth_date: nextBirthDate },
  });
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}
