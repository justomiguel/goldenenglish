import type { EventFieldPayloadEntry } from "@/lib/events/types";

export interface EventFieldValueRpcRow {
  field_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  file_storage_path?: string | null;
}

/**
 * Postgres `enroll_event_attendee` reads snake_case JSON keys (`field_id`, …).
 * The app validates camelCase entries; serialize before `p_field_values`.
 */
export function serializeEventFieldValuesForEnrollRpc(
  entries: EventFieldPayloadEntry[],
): EventFieldValueRpcRow[] {
  return entries.map((entry) => ({
    field_id: entry.fieldId,
    ...(entry.valueText != null && entry.valueText !== ""
      ? { value_text: entry.valueText }
      : {}),
    ...(typeof entry.valueNumber === "number" ? { value_number: entry.valueNumber } : {}),
    ...(entry.valueDate ? { value_date: entry.valueDate } : {}),
    ...(entry.fileStoragePath ? { file_storage_path: entry.fileStoragePath } : {}),
  }));
}
