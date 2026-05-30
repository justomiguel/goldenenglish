import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadEventAttendeesPaginated,
  type EventAttendeeRow,
} from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import type { EventAttendeesExportCustomColumn } from "@/lib/events/export/eventAttendeesExportTypes";

export const EVENT_ATTENDEES_EXPORT_PAGE_SIZE = 500;
export const EVENT_ATTENDEES_EXPORT_MAX_ROWS = 5000;

export interface LoadEventAttendeesForExportResult {
  attendees: EventAttendeeRow[];
  truncated: boolean;
  totalCount: number;
}

export async function loadEventAttendeesForExport(
  adminClient: SupabaseClient,
  eventId: string,
): Promise<LoadEventAttendeesForExportResult> {
  const allRows: EventAttendeeRow[] = [];
  let page = 1;
  let totalCount = 0;

  while (allRows.length < EVENT_ATTENDEES_EXPORT_MAX_ROWS) {
    const batch = await loadEventAttendeesPaginated(adminClient, {
      eventId,
      page,
      pageSize: EVENT_ATTENDEES_EXPORT_PAGE_SIZE,
    });
    totalCount = batch.totalCount;
    if (batch.rows.length === 0) break;
    allRows.push(...batch.rows);
    if (allRows.length >= totalCount) break;
    page += 1;
  }

  const truncated = totalCount > EVENT_ATTENDEES_EXPORT_MAX_ROWS;
  return {
    attendees: allRows.slice(0, EVENT_ATTENDEES_EXPORT_MAX_ROWS),
    truncated,
    totalCount,
  };
}

export async function loadEventFormFieldColumnsForExport(
  adminClient: SupabaseClient,
  eventId: string,
  adminLocale: string,
): Promise<EventAttendeesExportCustomColumn[]> {
  const { data, error } = await adminClient
    .from("event_form_fields")
    .select("field_key, label_i18n, position")
    .eq("event_id", eventId)
    .order("position", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const labelI18n = (row.label_i18n ?? {}) as Record<string, string>;
    const label =
      labelI18n[adminLocale]?.trim() ||
      labelI18n.es?.trim() ||
      labelI18n.en?.trim() ||
      String(row.field_key);
    return {
      fieldKey: String(row.field_key),
      label,
    };
  });
}
