"use client";

import { useState } from "react";
import { AdminEventAttendeeTableRow } from "@/components/dashboard/admin/events/AdminEventAttendeeTableRow";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

interface AdminEventAttendeesTableBodyProps {
  locale: string;
  eventId: string;
  rows: EventAttendeeRow[];
  customFieldValues: EventAttendeeCustomFieldValuesMap;
  labels: AdminEventAttendeesPanelLabels;
}

export function AdminEventAttendeesTableBody({
  locale,
  eventId,
  rows,
  customFieldValues,
  labels,
}: AdminEventAttendeesTableBodyProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(rowId: string) {
    setExpandedId((current) => (current === rowId ? null : rowId));
  }

  return (
    <tbody>
      {rows.map((row) => (
        <AdminEventAttendeeTableRow
          key={row.id}
          row={row}
          customFields={customFieldValues[row.id] ?? []}
          locale={locale}
          eventId={eventId}
          labels={labels}
          expanded={expandedId === row.id}
          deletable={canDeleteEventAttendee(row.payment)}
          onToggle={() => toggleRow(row.id)}
        />
      ))}
    </tbody>
  );
}
