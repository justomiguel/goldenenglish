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
import type { ParsedEventDiscountCode } from "@/lib/events/parseEventDiscountCodeSheet";
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

type DiscountKind = "percent" | "amount";

const BLOCKING = new Set(["wrong_file", "examples_only", "empty_file"]);

async function auditCodes(
  eventId: string,
  action: string,
  mode: DiscountKind,
  savedIds: string[],
  errorCount: number,
): Promise<void> {
  await recordSystemAudit({
    action,
    resourceType: "event_discount_code",
    resourceId: eventId,
    payload: { mode, savedCount: savedIds.length, errorCount, codeIds: savedIds.slice(0, 20) },
  });
}

function refresh(locale: string, eventId: string): void {
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
}

async function eventCurrency(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  eventId: string,
): Promise<string> {
  const { data } = await admin.from("events").select("currency").eq("id", eventId).maybeSingle();
  return String(data?.currency ?? "CLP");
}

function toExportRows(kind: DiscountKind, rows: ParsedEventDiscountCode[]) {
  return rows.map((row) => ({
    code: row.code,
    uses: row.maxUses == null ? "N" : String(row.maxUses),
    percent: row.kind === "percent" ? row.discountPercent : undefined,
    amount: row.kind === "amount" ? row.discountAmount : undefined,
    tickets: row.kind === "amount" ? row.ticketCount : undefined,
  })).filter((row) => (kind === "amount" ? row.amount != null : row.percent != null));
}

export async function saveEventDiscountCodeAction(input: {
  locale: string;
  eventId: string;
  kind: DiscountKind;
  code: string;
  uses: string;
  percent: string;
  amount: string;
  tickets: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = await createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const occupied = new Map(current.map((row) => [row.code.toLowerCase(), row.reserved + row.consumed]));
  const matrix =
    input.kind === "amount"
      ? [["code", "uses", "amount", "tickets", "example"], [input.code, input.uses, input.amount, input.tickets, ""]]
      : [[input.code, input.uses, input.percent]];
  const parsed = parseEventDiscountCodeSheet(matrix, occupied, {
    kind: input.kind,
    currency: await eventCurrency(admin, input.eventId),
  });
  if (parsed.rows.length === 0) {
    return { ok: false, code: parsed.errors[0]?.code ?? "invalid", errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.save", input.kind, savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: savedIds.length, errorCount: parsed.errors.length, errors: parsed.errors };
}

export async function importEventDiscountCodesAction(input: {
  locale: string;
  eventId: string;
  kind: DiscountKind;
  fileBase64: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const matrix = readDiscountCodeMatrix(input.fileBase64);
  if (!matrix) return { ok: false, code: "file" };
  const admin = await createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const occupied = new Map(current.map((row) => [row.code.toLowerCase(), row.reserved + row.consumed]));
  const parsed = parseEventDiscountCodeSheet(matrix, occupied, {
    kind: input.kind,
    currency: await eventCurrency(admin, input.eventId),
  });
  const blocking = parsed.errors.find((error) => BLOCKING.has(error.code));
  if (blocking) {
    await auditCodes(input.eventId, "event_discount_codes.import", input.kind, [], parsed.errors.length);
    return { ok: false, code: blocking.code, errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.import", input.kind, savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: savedIds.length, errorCount: parsed.errors.length, errors: parsed.errors };
}

export async function generateEventDiscountCodesAction(input: {
  locale: string;
  eventId: string;
  kind: DiscountKind;
  quantity: number;
  uses: string;
  percent: string;
  amount: string;
  tickets: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = await createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const generated = generateEventDiscountCodes({
    quantity: input.quantity,
    existing: new Set(current.map((row) => row.code.toLowerCase())),
  });
  if (!generated.ok) return { ok: false, code: generated.code };
  const matrix =
    input.kind === "amount"
      ? [
          ["code", "uses", "amount", "tickets", "example"],
          ...generated.codes.map((code) => [code, input.uses, input.amount, input.tickets, ""]),
        ]
      : generated.codes.map((code) => [code, input.uses, input.percent]);
  const parsed = parseEventDiscountCodeSheet(matrix, new Map(), {
    kind: input.kind,
    currency: await eventCurrency(admin, input.eventId),
  });
  if (parsed.rows.length === 0) {
    return { ok: false, code: parsed.errors[0]?.code ?? "invalid", errors: parsed.errors };
  }
  const savedIds = await saveEventDiscountCodes(admin, input.eventId, parsed.rows);
  await auditCodes(input.eventId, "event_discount_codes.generate", input.kind, savedIds, parsed.errors.length);
  refresh(input.locale, input.eventId);
  const downloadBase64 = await buildEventDiscountCodesXlsx({ kind: input.kind, rows: toExportRows(input.kind, parsed.rows) });
  return { ok: true, savedCount: savedIds.length, downloadBase64 };
}

export async function exportEventDiscountCodesAction(input: {
  locale: string;
  eventId: string;
  kind: DiscountKind;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = await createAdminClient();
  const current = await loadEventDiscountCodes(admin, input.eventId);
  const rows = current
    .filter((row) => row.kind === input.kind)
    .map((row) => ({
      code: row.code,
      uses: row.maxUses == null ? "N" : String(row.maxUses),
      percent: row.discountPercent ?? undefined,
      amount: row.discountAmount ?? undefined,
      tickets: row.ticketCount ?? undefined,
    }));
  await auditCodes(input.eventId, "event_discount_codes.export", input.kind, current.map((row) => row.id), 0);
  const downloadBase64 = await buildEventDiscountCodesXlsx({ kind: input.kind, rows });
  return { ok: true, downloadBase64 };
}

export async function deleteEventDiscountCodeAction(input: {
  locale: string;
  eventId: string;
  codeId: string;
}): Promise<EventDiscountCodeActionResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const admin = await createAdminClient();
  const { data, error } = await admin.rpc("delete_event_discount_code", { p_code_id: input.codeId });
  if (error) return { ok: false, code: "delete_failed" };
  const status = String(data ?? "");
  if (status !== "ok") return { ok: false, code: status || "delete_failed" };
  await auditCodes(input.eventId, "event_discount_codes.delete", "percent", [input.codeId], 0);
  refresh(input.locale, input.eventId);
  return { ok: true, savedCount: 1 };
}
