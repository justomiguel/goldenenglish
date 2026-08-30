"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { AdminEventAttendeeTableRow } from "@/components/dashboard/admin/events/AdminEventAttendeeTableRow";
import type { AdminEventAttendeeCustomFieldColumn } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import {
  ADMIN_EVENT_ATTENDEES_TABLE_ACTIONS_HEAD_CELL,
  ADMIN_EVENT_ATTENDEES_TABLE_CUSTOM_HEAD_CELL,
  ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL,
} from "@/lib/dashboard/events/adminEventAttendeesTableClasses";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import type { SortableValue } from "@/lib/sort/compareSortValues";

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
  const sortLabels = tableSortLabels(locale);
  const getters = useMemo(() => {
    const record: Record<string, (row: EventAttendeeRow) => SortableValue> = {
      name: (row) => `${row.lastName} ${row.firstName}`,
      dni: (row) => row.dniOrPassport,
      email: (row) => row.email,
      phone: (row) => row.phone ?? "",
      status: (row) => row.status,
      payment: (row) => row.payment?.status ?? "",
    };
    for (const column of customFieldColumns) {
      record[`custom:${column.fieldKey}`] = (row) => {
        const fields = customFieldValues[row.id] ?? [];
        return fields.find((field) => field.fieldKey === column.fieldKey)?.displayValue ?? "";
      };
    }
    return record;
  }, [customFieldColumns, customFieldValues]);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    getters,
    "name",
  );

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
      <table className="w-max min-w-full border-collapse text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <tr>
            <th scope="col" className={`${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} w-12`}>
              <span className="sr-only">{labels.columns.name}</span>
            </th>
            <SortableTh columnId="name" label={labels.columns.name} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            <SortableTh columnId="dni" label={labels.columns.dni} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            <SortableTh columnId="email" label={labels.columns.email} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            <SortableTh columnId="phone" label={labels.columns.phone} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            <SortableTh columnId="status" label={labels.columns.status} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            <SortableTh columnId="payment" label={labels.columns.payment} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className={ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} />
            {customFieldColumns.map((column) => (
              <SortableTh
                key={column.fieldKey}
                columnId={`custom:${column.fieldKey}`}
                label={column.label}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
                className={ADMIN_EVENT_ATTENDEES_TABLE_CUSTOM_HEAD_CELL}
              />
            ))}
            <th scope="col" className={ADMIN_EVENT_ATTENDEES_TABLE_ACTIONS_HEAD_CELL}>
              {labels.columns.actions}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
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
