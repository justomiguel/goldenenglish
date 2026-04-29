import { Filter } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

interface CohortOption {
  id: string;
  name: string;
}

export interface FinanceHubCohortSelectorProps {
  cohorts: CohortOption[];
  selectedCohortId: string | null;
  year: number;
  currentTab: string;
  dict: Dictionary["admin"]["finance"]["overview"]["filters"];
}

export function FinanceHubCohortSelector({
  cohorts,
  selectedCohortId,
  year,
  currentTab,
  dict,
}: FinanceHubCohortSelectorProps) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
    >
      <input type="hidden" name="tab" value={currentTab} />
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-[var(--color-foreground)]">
          {dict.cohort}
        </span>
        <select
          name="cohort"
          defaultValue={selectedCohortId ?? ""}
          className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
        >
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-[var(--color-foreground)]">
          {dict.year}
        </span>
        <input
          type="number"
          name="year"
          min={2000}
          max={2100}
          defaultValue={year}
          className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40"
      >
        <Filter className="h-4 w-4" aria-hidden />
        {dict.applyFilters}
      </button>
    </form>
  );
}
