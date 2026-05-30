"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveEventPayment, rejectEventPayment } from "@/lib/events/server/reviewEventPaymentServer";
import { deleteEventPayment } from "@/lib/events/server/deleteEventPaymentServer";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function approveEventPaymentAction(
  locale: string,
  paymentId: string,
  notes?: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const result = await approveEventPayment({ adminClient: admin, actorId, paymentId, notes: notes ?? null });
  revalidatePath(adminEventsPath(locale), "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  return { ok: result.ok, message: result.ok ? undefined : "save_failed" };
}

export async function rejectEventPaymentAction(
  locale: string,
  paymentId: string,
  notes: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const result = await rejectEventPayment({ adminClient: admin, actorId, paymentId, notes });
  revalidatePath(adminEventsPath(locale), "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  return { ok: result.ok, message: result.ok ? undefined : "save_failed" };
}

export async function deleteEventPaymentAction(
  locale: string,
  paymentId: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const result = await deleteEventPayment({
    adminClient: admin,
    actorId,
    paymentId,
    eventId,
  });
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/dashboard/admin/finance`, "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.code === "not_deletable"
          ? "not_deletable"
          : result.code === "not_found"
            ? "not_found"
            : "delete_failed",
    };
  }
  return { ok: true };
}
