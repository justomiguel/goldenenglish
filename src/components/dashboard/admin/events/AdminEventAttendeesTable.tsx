"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { AdminEventAttendeeTableRow } from "@/components/dashboard/admin/events/AdminEventAttendeeTableRow";
import type { AdminEventAttendeeCustomFieldColumn } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import { ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL } from "@/lib/dashboard/events/adminEventAttendeesTableClasses";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

interface AdminEventAttendeesTableProps {
  locale: string;
  eventId: string;
  rows: EventAttendeeRow[];
  customFieldValues: EventAttendeeCustomFieldValuesMap;
  customFieldColumns: AdminEventAttendeeCustomFieldColumn[];
  labels: AdminEventAttendeesPanelLabels;
}

export function AdminEventAttendeesTable({
  locale,
  eventId,
  rows,
  customFieldValues,
  customFieldColumns,
  labels,
}: AdminEventAttendeesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(rowId: string) {
    setExpandedId((current) => (current === rowId ? null : rowId));
  }

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
      <table className="w-full min-w-[56rem] border-collapse text-sm">
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
            {customFieldColumns.map((column) => (
              <th key={column.fieldKey} scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL}>
                {column.label}
              </th>
            ))}
            <th scope="col" className={`${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} min-w-[11rem] text-right`}>
              {labels.columns.actions}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AdminEventAttendeeTableRow
              key={row.id}
              row={row}
              customFields={customFieldValues[row.id] ?? []}
              customFieldColumns={customFieldColumns}
              locale={locale}
              eventId={eventId}
              labels={labels}
              expanded={expandedId === row.id}
              deletable={canDeleteEventAttendee(row.payment)}
              onToggle={() => toggleRow(row.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
