"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveEventPayment, rejectEventPayment, revertEventPaymentApproval } from "@/lib/events/server/reviewEventPaymentServer";
import { deleteEventPayment } from "@/lib/events/server/deleteEventPaymentServer";
import { openEventWrite } from "@/app/[locale]/dashboard/admin/events/eventWriteClient";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

async function paymentWrite(eventId?: string) {
  if (eventId) return openEventWrite(eventId);
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false as const, code: "forbidden" as const };
  return {
    ok: true as const,
    client: await createAdminClient(),
    actorId,
    access: "local" as const,
    ownerSlug: "",
  };
}

export async function approveEventPaymentAction(
  locale: string,
  paymentId: string,
  notes?: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const opened = await paymentWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const result = await approveEventPayment({
    adminClient: opened.client,
    actorId: opened.actorId,
    reviewedBy: opened.access === "guest" ? null : opened.actorId,
    paymentId,
    notes: notes ?? null,
  });
  revalidatePath(adminEventsPath(locale), "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  if (!result.ok) {
    return {
      ok: false,
      message: result.code === "gateway_managed" ? "gateway_managed" : "save_failed",
    };
  }
  return { ok: true };
}

export async function rejectEventPaymentAction(
  locale: string,
  paymentId: string,
  notes: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const opened = await paymentWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const result = await rejectEventPayment({
    adminClient: opened.client,
    actorId: opened.actorId,
    reviewedBy: opened.access === "guest" ? null : opened.actorId,
    paymentId,
    notes,
  });
  revalidatePath(adminEventsPath(locale), "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  if (!result.ok) {
    return {
      ok: false,
      message: result.code === "gateway_managed" ? "gateway_managed" : "save_failed",
    };
  }
  return { ok: true };
}

export async function deleteEventPaymentAction(
  locale: string,
  paymentId: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const opened = await paymentWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const result = await deleteEventPayment({
    adminClient: opened.client,
    actorId: opened.access === "guest" ? "" : opened.actorId,
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

export async function revertEventPaymentApprovalAction(
  locale: string,
  paymentId: string,
  notes?: string,
  eventId?: string,
): Promise<EventMutationResult> {
  const opened = await paymentWrite(eventId);
  if (!opened.ok) return { ok: false, message: opened.code };
  const result = await revertEventPaymentApproval({
    adminClient: opened.client,
    actorId: opened.actorId,
    reviewedBy: opened.access === "guest" ? null : opened.actorId,
    paymentId,
    notes: notes ?? null,
  });
  revalidatePath(adminEventsPath(locale), "page");
  if (eventId) revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.code === "not_revertible"
          ? "not_revertible"
          : result.code === "not_found"
            ? "not_found"
            : "save_failed",
    };
  }
  return { ok: true };
}
