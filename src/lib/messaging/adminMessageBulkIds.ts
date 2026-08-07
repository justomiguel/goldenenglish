import { z } from "zod";

/** Max message IDs accepted in one admin bulk request. */
export const ADMIN_MESSAGE_BULK_ID_CAP = 100;

const uuidSchema = z.string().uuid();

export type NormalizeAdminMessageBulkIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; code: "empty" | "invalid_id" | "too_many" };

/**
 * Dedupes and validates a bulk ID list for admin mailbox actions.
 * Order of first occurrence is preserved.
 */
export function normalizeAdminMessageBulkIds(raw: unknown): NormalizeAdminMessageBulkIdsResult {
  if (!Array.isArray(raw)) return { ok: false, code: "invalid_id" };

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    const parsed = uuidSchema.safeParse(item);
    if (!parsed.success) return { ok: false, code: "invalid_id" };
    if (seen.has(parsed.data)) continue;
    seen.add(parsed.data);
    ids.push(parsed.data);
  }

  if (ids.length === 0) return { ok: false, code: "empty" };
  if (ids.length > ADMIN_MESSAGE_BULK_ID_CAP) return { ok: false, code: "too_many" };
  return { ok: true, ids };
}
