import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEventPaymentReceiptPath } from "@/lib/events/buildEventPaymentReceiptPath";
import { EVENT_TRANSFER_RECEIPT_MAX_BYTES } from "@/lib/events/eventTransferReceiptLimits";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/eventUploadsBucket";
import { notifyAdminsEventReceiptPending } from "@/lib/email/notifyAdminsReceiptPending";
import {
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

export type AttachEventPaymentReceiptResult =
  | { ok: true; path: string }
  | { ok: false; code: "missing_object" | "too_large" | "storage_failed" | "update_failed" };

interface StorageRow {
  name: string;
  metadata?: { size?: unknown } | null;
}

function byteSize(row: StorageRow): number | null {
  const raw = row.metadata?.size;
  const size = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(size) && size > 0 ? size : null;
}

async function findStagedObject(
  admin: SupabaseClient,
  stagingPath: string,
): Promise<{ ok: true; size: number | null } | { ok: false; code: "missing_object" | "storage_failed" }> {
  const slash = stagingPath.lastIndexOf("/");
  const folder = stagingPath.slice(0, slash);
  const name = stagingPath.slice(slash + 1);
  const { data, error } = await admin.storage.from(EVENT_UPLOADS_BUCKET).list(folder, { limit: 100 });
  if (error) {
    await logSupabaseClientError("events.attachReceipt:list", error, { folder });
    return { ok: false, code: "storage_failed" };
  }
  const row = (data as StorageRow[] | null)?.find((item) => item.name === name);
  if (!row) {
    await logServerWarn("events.attachReceipt", { reason: "missing_object" });
    return { ok: false, code: "missing_object" };
  }
  return { ok: true, size: byteSize(row) };
}

export async function attachEventPaymentReceipt(
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
): Promise<AttachEventPaymentReceiptResult> {
  const staged = await findStagedObject(admin, input.stagingPath);
  if (!staged.ok) return staged;
  if (staged.size != null && staged.size > EVENT_TRANSFER_RECEIPT_MAX_BYTES) {
    await admin.storage.from(EVENT_UPLOADS_BUCKET).remove([input.stagingPath]);
    await logServerWarn("events.attachReceipt", { reason: "too_large", attendeeId: input.attendeeId });
    return { ok: false, code: "too_large" };
  }

  const path = buildEventPaymentReceiptPath({
    eventId: input.eventId,
    attendeeId: input.attendeeId,
    filename: input.fileName,
    mime: input.mime,
  });
  const { error: moveError } = await admin.storage
    .from(EVENT_UPLOADS_BUCKET)
    .move(input.stagingPath, path);
  if (moveError) {
    await logSupabaseClientError("events.attachReceipt:move", moveError, {
      attendeeId: input.attendeeId,
    });
    return { ok: false, code: "storage_failed" };
  }

  const written = await writePaymentRow(admin, input, path);
  if (!written) {
    await admin.storage.from(EVENT_UPLOADS_BUCKET).remove([path]);
    return { ok: false, code: "update_failed" };
  }

  try {
    await notifyAdminsEventReceiptPending(input.attendeeId);
  } catch (error) {
    logServerException("events.attachReceipt:mail", error);
  }
  return { ok: true, path };
}

async function writePaymentRow(
  admin: SupabaseClient,
  input: {
    attendeeId: string;
    amount: number;
    currency: string;
    uploadedByUserId?: string | null;
  },
  path: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("event_payments")
    .select("id, status, receipt_storage_path")
    .eq("event_attendee_id", input.attendeeId)
    .maybeSingle();
  if (error) {
    await logSupabaseClientError("events.attachReceipt:load", error, { attendeeId: input.attendeeId });
    return false;
  }

  const existing = data as { id: string; status: string; receipt_storage_path: string | null } | null;
  const writeError = existing
    ? (
        await admin
          .from("event_payments")
          .update({
            receipt_storage_path: path,
            receipt_uploaded_by: input.uploadedByUserId ?? null,
          })
          .eq("id", existing.id)
          .eq("status", "pending")
          .is("receipt_storage_path", null)
      ).error
    : (
        await admin.from("event_payments").insert({
          event_attendee_id: input.attendeeId,
          amount: input.amount,
          currency: input.currency,
          status: "pending",
          receipt_storage_path: path,
          receipt_uploaded_by: input.uploadedByUserId ?? null,
        })
      ).error;

  if (writeError) {
    await logSupabaseClientError("events.attachReceipt:write", writeError, {
      attendeeId: input.attendeeId,
    });
    return false;
  }
  return true;
}
