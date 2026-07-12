import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { createEventUploadReadSignedUrlMap } from "@/lib/events/createEventUploadReadSignedUrl";
import { basenameFromStoragePath } from "@/lib/events/eventUploadPathDisplay";
import type { EventFormFieldType } from "@/lib/events/types";

export interface EventAttendeeCustomFieldValue {
  fieldKey: string;
  label: string;
  displayValue: string;
  fieldType?: EventFormFieldType;
  fileStoragePath?: string | null;
  previewUrl?: string | null;
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
    return basenameFromStoragePath(row.file_storage_path);
  }
  return "";
}

type FieldJoin = {
  field_key: string;
  field_type: string;
  label_i18n: Record<string, string> | null;
  archived_at: string | null;
};

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
    "attendee_id, value_text, value_number, value_date, file_storage_path, event_form_fields!inner(field_key, field_type, label_i18n, archived_at)",
  );

  const filePaths: string[] = [];
  for (const row of rows) {
    const path = typeof row.file_storage_path === "string" ? row.file_storage_path.trim() : "";
    if (path) filePaths.push(path);
  }
  const signedUrlByPath = await createEventUploadReadSignedUrlMap(filePaths, adminClient);

  const result: EventAttendeeCustomFieldValuesMap = {};

  for (const row of rows) {
    const attendeeId = String(row.attendee_id);
    const field = row.event_form_fields as FieldJoin | FieldJoin[] | null;
    const fieldRow = Array.isArray(field) ? field[0] : field;
    if (!fieldRow || fieldRow.archived_at) continue;

    const fileStoragePath =
      typeof row.file_storage_path === "string" && row.file_storage_path.trim()
        ? row.file_storage_path.trim()
        : null;
    const displayValue = formatFieldDisplayValue({
      value_text: row.value_text as string | null,
      value_number: row.value_number as number | null,
      value_date: row.value_date as string | null,
      file_storage_path: fileStoragePath,
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
      fieldType: String(fieldRow.field_type) as EventFormFieldType,
      fileStoragePath,
      previewUrl: fileStoragePath ? (signedUrlByPath.get(fileStoragePath) ?? null) : null,
    });
  }

  return result;
}
