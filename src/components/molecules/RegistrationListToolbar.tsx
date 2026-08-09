"use client";

import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { exportRegistrationsAction } from "@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction";
import { downloadBase64 } from "@/lib/download/downloadBase64";
import { logClientException } from "@/lib/logging/clientLog";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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
      const res = await exportRegistrationsAction({ locale, q: query, status: statusFilter });
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
    <div data-tour={ADMIN_TOUR_ANCHORS.registrationsToolbar}>
      <form onSubmit={onSubmitFilter} className="space-y-1">
        <Label htmlFor="registrations-filter">{labels.filterLabel}</Label>
        <Input
          id="registrations-filter"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={labels.filterPlaceholder}
          title={labels.filterTooltip}
          className="w-full max-w-xl"
          autoComplete="off"
        />
      </form>
      {statusCounts && onStatusFilterChange ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={labels.status}>
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
                    ? "border-[var(--color-secondary)] bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {tpl(chip.label, chip.count)}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
        <span>{tpl(labels.countTotal, totalCount)}</span>
        <span>{tpl(labels.countAfterFilter, filteredCount)}</span>
        {locale ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={labels.exportTip}
            disabled={exporting}
            className="border border-[var(--color-border)] bg-[var(--color-surface)]"
            onClick={onExport}
          >
            <Download className="mr-1 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
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
