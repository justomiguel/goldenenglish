import { Users } from "lucide-react";
import { AdminEventAttendeesTableBody } from "@/components/dashboard/admin/events/AdminEventAttendeesTableBody";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import { ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL } from "@/lib/dashboard/events/adminEventAttendeesTableClasses";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

interface AdminEventAttendeesTableProps {
  locale: string;
  eventId: string;
  rows: EventAttendeeRow[];
  customFieldValues: EventAttendeeCustomFieldValuesMap;
  labels: AdminEventAttendeesPanelLabels;
}

export function AdminEventAttendeesTable({
  locale,
  eventId,
  rows,
  customFieldValues,
  labels,
}: AdminEventAttendeesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-muted)_35%,var(--color-surface))] px-6 py-12 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-[var(--color-primary-dark)]">
          <Users className="h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-12" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[22%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[14%]" />
          <col className="w-[5.5rem]" />
        </colgroup>
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <tr>
            <th scope="col" className={`${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} w-12`}>
              <span className="sr-only">{labels.columns.name}</span>
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.name}
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.dni}
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.email}
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.phone}
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.status}
            </th>
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
              {labels.columns.payment}
            </th>
            <th scope="col" className={`${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} text-right`}>
              {labels.columns.actions}
            </th>
          </tr>
        </thead>
        <AdminEventAttendeesTableBody
          locale={locale}
          eventId={eventId}
          rows={rows}
          customFieldValues={customFieldValues}
          labels={labels}
        />
      </table>
    </div>
  );
}
