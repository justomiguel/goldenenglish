"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { resolveEventPriceForResidency } from "@/lib/events/resolveEventPriceTier";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { prepareEventMediaFileUpload } from "@/lib/events/server/prepareEventMediaFileUpload";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";
import { deleteEventAttendee } from "@/lib/events/server/deleteEventAttendeeServer";

export async function promoteEventAttendeeToUserAction(input: {
  locale: string;
  attendeeId: string;
  role?: "student" | "teacher" | "parent" | "assistant" | "admin";
  password?: string;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { data: attendee, error } = await admin
    .from("event_attendees")
    .select("id, first_name, last_name, dni_or_passport, email, phone")
    .eq("id", input.attendeeId)
    .maybeSingle();
  if (error || !attendee) return { ok: false, message: "attendee_not_found" };

  const created = await createDashboardUser({
    locale: input.locale,
    email: String(attendee.email),
    password: input.password ?? "",
    role: input.role ?? "student",
    first_name: String(attendee.first_name),
    last_name: String(attendee.last_name),
    dni_or_passport: String(attendee.dni_or_passport),
    phone: String(attendee.phone ?? ""),
    provisioning_route: "admin_ui",
  });
  if (!created.ok) {
    const message = "message" in created ? created.message : "user_creation_failed";
    return { ok: false, message };
  }

  revalidatePath(adminEventsPath(input.locale), "page");
  return { ok: true };
}

export async function promoteFromWaitlistAction(locale: string, attendeeId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();

  const { data: attendee } = await admin
    .from("event_attendees")
    .select("id, event_id, is_local_resident")
    .eq("id", attendeeId)
    .eq("status", "waitlist")
    .maybeSingle();
  if (!attendee?.id) return { ok: false, message: "attendee_not_found" };

  const { data: event } = await admin
    .from("events")
    .select("price, price_local, price_non_local")
    .eq("id", attendee.event_id as string)
    .maybeSingle();
  const amount = resolveEventPriceForResidency(
    {
      price: event?.price == null ? null : Number(event.price),
      priceLocal: event?.price_local == null ? null : Number(event.price_local),
      priceNonLocal: event?.price_non_local == null ? null : Number(event.price_non_local),
    },
    Boolean(attendee.is_local_resident),
  );
  const nextStatus = amount != null && amount > 0 ? "pending_payment" : "confirmed";

  const { error } = await admin
    .from("event_attendees")
    .update({ status: nextStatus })
    .eq("id", attendeeId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(adminEventsPath(locale), "page");
  return { ok: true };
}

export async function cancelEventAttendeeAction(locale: string, attendeeId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("event_attendees")
    .update({ status: "cancelled" })
    .eq("id", attendeeId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(adminEventsPath(locale), "page");
  return { ok: true };
}

export async function deleteEventAttendeeAction(
  locale: string,
  attendeeId: string,
  eventId: string,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const result = await deleteEventAttendee({
    adminClient: admin,
    actorId,
    attendeeId,
    eventId,
  });
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/dashboard/admin/finance`, "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
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

export async function prepareEventMediaFileUploadAction(raw: unknown) {
  try {
    const { supabase, user } = await assertAdmin();
    return prepareEventMediaFileUpload(supabase, user.id, raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("prepareEventMediaFileUploadAction");
    }
    return { ok: false as const, code: "forbidden" as const };
  }
}
