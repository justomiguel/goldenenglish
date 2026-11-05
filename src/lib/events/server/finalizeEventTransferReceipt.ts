import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { attachEventPaymentReceipt } from "@/lib/events/server/attachEventPaymentReceipt";
import { releaseSeatsForAttendee } from "@/lib/events/server/eventSeatLocksServer";
import { logServerError, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function finalizeEventTransferReceipt(
  admin: SupabaseClient,
  input: {
    eventId: string;
    attendeeId: string;
    amount: number;
    currency: string;
    stagingPath: string;
    fileName: string;
    mime: string;
    uploadedByUserId?: string | null;
  },
): Promise<{ ok: true } | { ok: false; code: string }> {
  const attached = await attachEventPaymentReceipt(admin, input);
  if (attached.ok) return { ok: true };

  const { error } = await admin
    .from("event_attendees")
    .update({ status: "cancelled" })
    .eq("id", input.attendeeId);
  if (error) {
    await logSupabaseClientError("events.enroll.cancelAfterReceipt", error, {
      attendeeId: input.attendeeId,
    });
  }
  await releaseSeatsForAttendee(admin, input.attendeeId);
  await logServerError("events.enroll.receiptAttach", {
    code: attached.code,
    attendeeId: input.attendeeId,
    eventId: input.eventId,
  });
  return { ok: false, code: attached.code };
}
