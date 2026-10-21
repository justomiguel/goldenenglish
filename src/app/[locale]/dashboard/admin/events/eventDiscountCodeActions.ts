"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { buildEventDiscountCodesXlsx } from "@/lib/events/export/buildEventDiscountCodesXlsx";
import { generateEventDiscountCodes } from "@/lib/events/generateEventDiscountCodes";
import { parseEventDiscountCodeSheet } from "@/lib/events/parseEventDiscountCodeSheet";
import { readDiscountCodeMatrix } from "@/lib/events/readDiscountCodeMatrix";
import { saveEventDiscountCodes } from "@/lib/events/server/saveEventDiscountCodes";
import { loadEventDiscountCodes } from "@/lib/dashboard/events/loadEventDiscountCodes";
import {
  adminEventsPath,
  requireAdminEventActor,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export interface EventDiscountCodeActionResult {
  ok: boolean;
  code?: string;
  savedCount?: number;
  errorCount?: number;
  errors?: { row: number; code: string }[];
  downloadBase64?: string;
}

async function auditCodes(
  eventId: string,
  action: string,
  savedIds: string[],
  errorCount: number,
): Promise<void> {
  await recordSystemAudit({
    action,
    resourceType: "event_discount_code",
    resourceId: eventId,
    payload: {
      savedCount: savedIds.length,
      errorCount,
      codeIds: savedIds.slice(0, 20),
    },
  });
}

function refresh(locale: string, eventId: string): void {
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
}

export async function saveEventDiscountCodeAction(input: {
  locale: string;
  eventId: string;
  code: string;
  uses: string;
  percent: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const occupied = new Map(current.map((row) => [row.code.toLowerCase(), row.reserved + row.consumed]));
  const parsed = parseEventDiscountCodeSheet([[input.code, input.uses, input.percent]], occupied);
  if (parsed.rows.length === 0) {
    return { ok: false, code: parsed.errors[0]?.code ?? "invalid", errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.save", savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: savedIds.length, errorCount: parsed.errors.length, errors: parsed.errors };
}

export async function importEventDiscountCodesAction(input: {
  locale: string;
  eventId: string;
  fileBase64: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const matrix = readDiscountCodeMatrix(input.fileBase64);
  if (!matrix) return { ok: false, code: "file" };
  const admin = createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const occupied = new Map(current.map((row) => [row.code.toLowerCase(), row.reserved + row.consumed]));
  const parsed = parseEventDiscountCodeSheet(matrix, occupied);
  if (parsed.errors.some((error) => error.code === "empty_file")) {
    return { ok: false, code: "empty_file", errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.import", savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: savedIds.length, errorCount: parsed.errors.length, errors: parsed.errors };
}

export async function generateEventDiscountCodesAction(input: {
  locale: string;
  eventId: string;
  quantity: number;
  uses: string;
  percent: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const generated = generateEventDiscountCodes({
    quantity: input.quantity,
    existing: new Set(current.map((row) => row.code.toLowerCase())),
  });
  if (!generated.ok) return { ok: false, code: generated.code };
  const parsed = parseEventDiscountCodeSheet(
    generated.codes.map((code) => [code, input.uses, input.percent]),
  );
  if (parsed.rows.length === 0) {
    return { ok: false, code: parsed.errors[0]?.code ?? "invalid", errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.generate", savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  const downloadBase64 = await buildEventDiscountCodesXlsx(
    parsed.rows.map((row) => ({
      code: row.code,
      uses: row.maxUses == null ? "N" : String(row.maxUses),
      percent: row.discountPercent,
    })),
  );
  return { ok: true, savedCount: savedIds.length, downloadBase64 };
}

export async function deleteEventDiscountCodeAction(input: {
  locale: string;
  eventId: string;
  codeId: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("delete_event_discount_code", { p_code_id: input.codeId });
  if (error) return { ok: false, code: "delete_failed" };
  const status = String(data ?? "");
  if (status !== "ok") return { ok: false, code: status || "delete_failed" };
  await auditCodes(input.eventId, "event_discount_codes.delete", [input.codeId], 0);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: 1 };
}
