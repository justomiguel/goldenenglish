import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

export interface EventAttendeeCustomFieldValue {
  fieldKey: string;
  label: string;
  displayValue: string;
}

export type EventAttendeeCustomFieldValuesMap = Record<string, EventAttendeeCustomFieldValue[]>;

function formatFieldDisplayValue(row: {
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  file_storage_path: string | null;
}): string {
  if (row.value_text != null && row.value_text.trim() !== "") return row.value_text.trim();
  if (row.value_number != null) return String(row.value_number);
  if (row.value_date != null) return row.value_date;
  if (row.file_storage_path != null && row.file_storage_path.trim() !== "") {
    return row.file_storage_path.trim();
  }
  return "";
}

export async function loadEventAttendeeCustomFieldValues(
  adminClient: SupabaseClient,
  attendeeIds: string[],
  adminLocale: string,
): Promise<EventAttendeeCustomFieldValuesMap> {
  const uniqueIds = [...new Set(attendeeIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const rows = await chunkedIn<Record<string, unknown>>(
    adminClient,
    "event_attendee_field_values",
    "attendee_id",
    uniqueIds,
    "attendee_id, value_text, value_number, value_date, file_storage_path, event_form_fields!inner(field_key, label_i18n)",
  );

  const result: EventAttendeeCustomFieldValuesMap = {};

  for (const row of rows) {
    const attendeeId = String(row.attendee_id);
    const field = row.event_form_fields as
      | { field_key: string; label_i18n: Record<string, string> | null }
      | { field_key: string; label_i18n: Record<string, string> | null }[]
      | null;
    const fieldRow = Array.isArray(field) ? field[0] : field;
    if (!fieldRow) continue;

    const displayValue = formatFieldDisplayValue({
      value_text: row.value_text as string | null,
      value_number: row.value_number as number | null,
      value_date: row.value_date as string | null,
      file_storage_path: row.file_storage_path as string | null,
    });
    if (!displayValue) continue;

    const labelI18n = fieldRow.label_i18n ?? {};
    const label =
      labelI18n[adminLocale]?.trim() ||
      labelI18n.es?.trim() ||
      labelI18n.en?.trim() ||
      String(fieldRow.field_key);

    if (!result[attendeeId]) result[attendeeId] = [];
    result[attendeeId].push({
      fieldKey: String(fieldRow.field_key),
      label,
      displayValue,
    });
  }

  return result;
}
