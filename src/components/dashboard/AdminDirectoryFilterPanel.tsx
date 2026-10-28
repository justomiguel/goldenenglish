"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AcademicProfileDirectoryFilters } from "@/components/dashboard/AcademicProfileDirectoryFilters";
import {
  adminDirectoryFilterComboOptions,
  adminDirectoryFilterComboTitle,
} from "@/components/dashboard/adminDirectoryFilterOptions";
import { academicDirectoryFilterCount } from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";
import {
  adminDirectoryFilterKeys,
  adminDirectoryFiltersActive,
  type AdminDirectoryFilterKey,
  type AdminDirectoryFilters,
  type AdminDirectoryRole,
} from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["directoryFilters"];

export type AdminDirectoryAcademicFields = {
  columns: { id: string; label: string; fieldType: string; selectOptions: string[] }[];
  selectFacets: Record<string, Record<string, number>>;
  labels: Dictionary["admin"]["users"]["academicFields"];
};

export type AdminDirectoryFilterPanelProps = {
  role: AdminDirectoryRole;
  labels: Labels;
  values: AdminDirectoryFilters;
  facets: AdminDirectoryFacets;
  sectionOptions: { id: string; name: string }[];
  academicFields?: AdminDirectoryAcademicFields;
  onChange: (key: AdminDirectoryFilterKey, value: string | undefined) => void;
  onClear: () => void;
};

export function AdminDirectoryFilterPanel({
  role,
  labels,
  values,
  facets,
  sectionOptions,
  academicFields,
  onChange,
  onClear,
}: AdminDirectoryFilterPanelProps) {
  const formId = useId();
  const panelId = `${formId}-panel`;
  const searchParams = useSearchParams();
  const filtersActive =
    adminDirectoryFiltersActive(values) || academicDirectoryFilterCount(searchParams) > 0;
  const [open, setOpen] = useState(filtersActive);
  const keys = adminDirectoryFilterKeys(role);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 gap-2 rounded-xl border border-[var(--color-border)] px-4"
        aria-expanded={open}
        aria-controls={panelId}
        title={open ? labels.toggleCollapse : labels.toggleExpand}
        onClick={() => setOpen((v) => !v)}
      >
        <Filter className="h-4 w-4 shrink-0" aria-hidden />
        <span className="inline-flex items-center gap-2">
          {labels.toggle}
          {filtersActive ? (
            <span
              data-active-dot
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden
            />
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>

      <section
        id={panelId}
        hidden={!open}
        aria-label={labels.panelAria}
        className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] md:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {keys.map((key) => (
            <label key={key} className="block text-sm" htmlFor={`${formId}-${key}`}>
              <span className="mb-1 block text-[var(--color-muted-foreground)]">
                {adminDirectoryFilterComboTitle(key, labels)}
              </span>
              <select
                id={`${formId}-${key}`}
                value={(values[key] as string | undefined) ?? ""}
                onChange={(e) => onChange(key, e.target.value || undefined)}
                className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {adminDirectoryFilterComboOptions(key, labels, facets, sectionOptions).map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {academicFields ? (
            <AcademicProfileDirectoryFilters
              columns={academicFields.columns}
              selectFacets={academicFields.selectFacets}
              labels={academicFields.labels}
            />
          ) : null}
        </div>
        {filtersActive ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl border border-[var(--color-border)]"
              onClick={onClear}
            >
              {labels.clear}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
