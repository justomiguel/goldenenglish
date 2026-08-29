"use client";

import { useState, type FormEvent } from "react";
import { Download, Search } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { exportRegistrationsAction } from "@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction";
import { downloadBase64 } from "@/lib/download/downloadBase64";
import { logClientException } from "@/lib/logging/clientLog";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import type { RegistrationInboxCounts } from "@/lib/register/countRegistrationInboxFilters";

type RegLabels = Dictionary["admin"]["registrations"];

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export type RegistrationStatusFilterValue = "new" | "contacted" | undefined;

export interface RegistrationListToolbarProps {
  labels: RegLabels;
  query: string;
  onQueryChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  statusFilter?: RegistrationStatusFilterValue;
  statusCounts?: { total: number; new: number; contacted: number };
  onStatusFilterChange?: (next: RegistrationStatusFilterValue) => void;
  inboxFilter?: RegistrationInboxFilter;
  inboxCounts?: RegistrationInboxCounts;
  onInboxFilterChange?: (next: RegistrationInboxFilter) => void;
  locale?: string;
}

export function RegistrationListToolbar({
  labels,
  query,
  onQueryChange,
  totalCount,
  filteredCount,
  statusFilter,
  statusCounts,
  onStatusFilterChange,
  inboxFilter,
  inboxCounts,
  onInboxFilterChange,
  locale,
}: RegistrationListToolbarProps) {
  const { localValue, setLocalValue, flushNow } = useDebouncedSearch({
    value: query,
    onDebouncedChange: onQueryChange,
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function onSubmitFilter(e: FormEvent) {
    e.preventDefault();
    flushNow();
  }

  async function onExport() {
    if (!locale) return;
    setExporting(true);
    setExportError(null);
    try {
      // The export mirrors the active filters, so the file matches the screen.
      const res = await exportRegistrationsAction({
        locale,
        q: query,
        status: statusFilter,
        inbox: inboxFilter,
      });
      if (!res.ok) {
        setExportError(res.message);
        return;
      }
      downloadBase64(res.artifact.base64, res.artifact.mimeType, res.artifact.filename);
    } catch (err) {
      logClientException("RegistrationListToolbar:export", err);
      setExportError(labels.exportError);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div data-tour={ADMIN_TOUR_ANCHORS.registrationsToolbar} className="space-y-4">
      <form onSubmit={onSubmitFilter} className="relative min-w-0">
        <label htmlFor="registrations-filter" className="sr-only">
          {labels.filterLabel}
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
        <input
          id="registrations-filter"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={labels.filterPlaceholder}
          title={labels.filterTooltip}
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2 pl-10 pr-3 text-sm outline-none ring-[var(--color-primary)] placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-2"
        />
      </form>
      {inboxCounts && onInboxFilterChange ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.status}>
          {(
            [
              { value: "urgent" as const, label: labels.intake.filterUrgent, count: inboxCounts.urgent },
              { value: "awaiting_fee" as const, label: labels.intake.filterAwaiting, count: inboxCounts.awaiting_fee },
              { value: "receipt_pending" as const, label: labels.intake.filterReceipt, count: inboxCounts.receipt_pending },
              { value: "needs_section" as const, label: labels.intake.filterNeedsSection, count: inboxCounts.needs_section },
              { value: "section_full" as const, label: labels.intake.filterSectionFull, count: inboxCounts.section_full },
              { value: "contacted" as const, label: labels.intake.filterContacted, count: inboxCounts.contacted },
              { value: "trial" as const, label: labels.intake.filterTrial, count: inboxCounts.trial },
            ] satisfies { value: RegistrationInboxFilter; label: string; count: number }[]
          ).map((chip) => {
            const active = (inboxFilter ?? "urgent") === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => onInboxFilterChange(chip.value)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active
                    ? "border-[var(--color-primary)]/25 bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] font-semibold text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {tpl(chip.label, chip.count)}
              </button>
            );
          })}
        </div>
      ) : statusCounts && onStatusFilterChange ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.status}>
          {(
            [
              { value: undefined, label: labels.statusFilterAll, count: statusCounts.total },
              { value: "new" as const, label: labels.statusFilterNew, count: statusCounts.new },
              {
                value: "contacted" as const,
                label: labels.statusFilterContacted,
                count: statusCounts.contacted,
              },
            ] satisfies {
              value: RegistrationStatusFilterValue;
              label: string;
              count: number;
            }[]
          ).map((chip) => {
            const active = statusFilter === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusFilterChange(chip.value)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active
                    ? "border-[var(--color-primary)]/25 bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] font-semibold text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {tpl(chip.label, chip.count)}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {tpl(labels.countTotal, totalCount)}
          <span aria-hidden> • </span>
          {tpl(labels.countAfterFilter, filteredCount)}
        </p>
        {locale ? (
          <Button
            type="button"
            variant="primary"
            title={labels.exportTip}
            disabled={exporting}
            className="rounded-xl"
            onClick={onExport}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            {labels.exportButton}
          </Button>
        ) : null}
      </div>
      {exportError ? (
        <p className="mt-1 text-sm text-[var(--color-error)]" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
