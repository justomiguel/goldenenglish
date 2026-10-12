"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAdminEventActor,
  revalidateEventFormSurfaces,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

const priceModeSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  priceByFlow: z.boolean(),
});

const saveSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  flowId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  price: z.number().min(0).nullable(),
});

const flowSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  flowId: z.string().uuid(),
});

const assignSchema = flowSchema.extend({
  fieldId: z.string().uuid(),
  flowId: z.string().uuid().nullable(),
});

const orderSchema = flowSchema.extend({
  order: z.array(z.string().regex(/^field:[0-9a-f-]{36}$/i)).max(40),
});

async function activePackageExists(eventId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_ticket_packages")
    .select("id")
    .eq("event_id", eventId)
    .is("archived_at", null)
    .limit(1);
  if (error) {
    logSupabaseClientError("eventRegistrationFlow.packages", error, { eventId });
    return true;
  }
  return (data?.length ?? 0) > 0;
}

export async function updateEventPriceByFlowAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const parsed = priceModeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, priceByFlow } = parsed.data;
  if (priceByFlow && (await activePackageExists(eventId))) {
    return { ok: false, message: "price_mode_conflict" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ price_by_flow: priceByFlow }).eq("id", eventId);
  if (error) {
    logSupabaseClientError("eventRegistrationFlow.priceMode", error, { eventId });
    return { ok: false, message: "save_failed" };
  }
  if (!priceByFlow) {
    await admin.from("event_registration_flows").update({ price: null }).eq("event_id", eventId);
  }
  await recordSystemAudit({
    action: "event_registration_price_mode_updated",
    resourceType: "event",
    resourceId: eventId,
    payload: { priceByFlow },
  });
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function saveEventRegistrationFlowAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, flowId, name, price } = parsed.data;
  const admin = createAdminClient();
  const event = await admin.from("events").select("price_by_flow").eq("id", eventId).maybeSingle();
  if (event.error || !event.data) return { ok: false, message: "save_failed" };
  const priceByFlow = Boolean(event.data.price_by_flow);
  if (priceByFlow && price == null) return { ok: false, message: "validation_failed" };

  const storedPrice = priceByFlow ? price : null;
  const names = { es: name, en: name, pt: name };
  const existing = flowId
    ? null
    : await admin
        .from("event_registration_flows")
        .select("position")
        .eq("event_id", eventId)
        .is("archived_at", null)
        .order("position", { ascending: false })
        .limit(1);
  const nextPosition = (existing?.data?.[0]?.position ?? -1) + 1;
  const write = flowId
    ? await admin
        .from("event_registration_flows")
        .update({ name_i18n: names, price: storedPrice, updated_at: new Date().toISOString() })
        .eq("id", flowId)
        .eq("event_id", eventId)
    : await admin.from("event_registration_flows").insert({
        event_id: eventId,
        name_i18n: names,
        price: storedPrice,
        position: nextPosition,
      });
  if (write.error) {
    logSupabaseClientError("eventRegistrationFlow.save", write.error, { eventId });
    return { ok: false, message: "save_failed" };
  }
  await recordSystemAudit({
    action: "event_registration_flow_saved",
    resourceType: "event",
    resourceId: eventId,
    payload: { flowId: flowId ?? null },
  });
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function archiveEventRegistrationFlowAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const parsed = flowSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, flowId } = parsed.data;
  const admin = createAdminClient();
  const archivedAt = new Date().toISOString();
  const flow = await admin
    .from("event_registration_flows")
    .update({ archived_at: archivedAt })
    .eq("id", flowId)
    .eq("event_id", eventId);
  if (flow.error) {
    logSupabaseClientError("eventRegistrationFlow.archive", flow.error, { eventId, flowId });
    return { ok: false, message: "save_failed" };
  }
  await admin.from("event_form_fields").update({ archived_at: archivedAt }).eq("flow_id", flowId);
  await recordSystemAudit({
    action: "event_registration_flow_archived",
    resourceType: "event",
    resourceId: eventId,
    payload: { flowId },
  });
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function assignEventFormFieldFlowAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const parsed = assignSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, fieldId, flowId } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("event_form_fields")
    .update({ flow_id: flowId })
    .eq("id", fieldId)
    .eq("event_id", eventId);
  if (error) {
    logSupabaseClientError("eventRegistrationFlow.assign", error, { eventId, fieldId });
    return { ok: false, message: "save_failed" };
  }
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function updateEventRegistrationFlowFieldOrderAction(
  raw: unknown,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, flowId, order } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("event_registration_flows")
    .update({ field_order: order })
    .eq("id", flowId)
    .eq("event_id", eventId);
  if (error) {
    logSupabaseClientError("eventRegistrationFlow.order", error, { eventId, flowId });
    return { ok: false, message: "save_failed" };
  }
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}
