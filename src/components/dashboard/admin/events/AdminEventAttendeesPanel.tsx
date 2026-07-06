import { Search } from "lucide-react";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import { AdminEventAttendeesExportButtons } from "@/components/dashboard/admin/events/AdminEventAttendeesExportButtons";
import { AdminEventAttendeesPaginationBar } from "@/components/dashboard/admin/events/AdminEventAttendeesPaginationBar";
import { AdminEventAttendeesTable } from "@/components/dashboard/admin/events/AdminEventAttendeesTable";
import type { AdminEventAttendeeCustomFieldColumn } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";

export type { AdminEventAttendeesPanelLabels };

interface AdminEventAttendeesPanelProps {
  locale: string;
  eventId: string;
  rows: EventAttendeeRow[];
  customFieldValues: EventAttendeeCustomFieldValuesMap;
  customFieldColumns: AdminEventAttendeeCustomFieldColumn[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  labels: AdminEventAttendeesPanelLabels;
}

export function AdminEventAttendeesPanel({
  locale,
  eventId,
  rows,
  customFieldValues,
  customFieldColumns,
  totalCount,
  page,
  pageSize,
  searchQuery,
  labels,
}: AdminEventAttendeesPanelProps) {
  const baseHref = `/${locale}/dashboard/admin/events/${eventId}`;

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.title}</h2>
          <AdminEventAttendeesExportButtons
            locale={locale}
            eventId={eventId}
            labels={labels.export}
            disabled={totalCount === 0}
          />
        </div>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value="attendees" />
          <input
            type="search"
            name="attendeesQ"
            defaultValue={searchQuery}
            placeholder={labels.searchPlaceholder}
            className="min-h-[36px] rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <Search className="h-4 w-4" aria-hidden />
            {labels.searchButton}
          </button>
        </form>
      </div>

      <AdminEventAttendeesPaginationBar
        baseHref={baseHref}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        searchQuery={searchQuery}
        labels={labels}
      />

      <AdminEventAttendeesTable
        locale={locale}
        eventId={eventId}
        rows={rows}
        customFieldValues={customFieldValues}
        customFieldColumns={customFieldColumns}
        labels={labels}
      />
    </section>
  );
}
