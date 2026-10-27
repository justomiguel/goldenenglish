"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { adminUsersSortColumnLabel } from "@/lib/dashboard/adminUsersSortKeys";
import {
  addAdminUsersSortCriterion,
  moveAdminUsersSortCriterion,
  replaceAdminUsersSortKey,
  setAdminUsersSortChecked,
  setAdminUsersSortDir,
  type AdminUsersSortCriterion,
} from "@/lib/dashboard/adminUsersSortCriteria";
import type { SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

function fieldLabel(template: string, index: number): string {
  return template.replace("{{n}}", String(index + 1));
}

export function AdminUsersSortChecklist({
  labels,
  sortKeys,
  criteria,
  onChange,
}: {
  labels: UserLabels;
  sortKeys: SortKey[];
  criteria: AdminUsersSortCriterion[];
  onChange: (next: AdminUsersSortCriterion[]) => void;
}) {
  const canAdd = criteria.length < sortKeys.length;

  return (
    <section
      aria-label={labels.sortPanelAria}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]"
    >
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.sortPanelTitle}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.sortPanelLead}</p>
      <ul className="mt-3 space-y-2">
        {criteria.map((criterion, index) => {
          const name = adminUsersSortColumnLabel(labels, criterion.key);
          const dirLabel = criterion.dir === "asc" ? labels.sortDirAsc : labels.sortDirDesc;
          return (
            <li key={criterion.key} className="flex items-center gap-1">
              <span className="w-5 shrink-0 text-sm tabular-nums text-[var(--color-muted-foreground)]">
                {index + 1}
              </span>
              <select
                aria-label={fieldLabel(labels.sortFieldLabel, index)}
                value={criterion.key}
                onChange={(event) =>
                  onChange(replaceAdminUsersSortKey(criteria, index, event.target.value as SortKey))
                }
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {sortKeys.map((key) => (
                  <option key={key} value={key}>
                    {adminUsersSortColumnLabel(labels, key)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                aria-label={`${dirLabel}: ${name}`}
                title={dirLabel}
                onClick={() =>
                  onChange(
                    setAdminUsersSortDir(criteria, criterion.key, criterion.dir === "asc" ? "desc" : "asc"),
                  )
                }
              >
                {criterion.dir === "asc" ? (
                  <ArrowUp className="h-4 w-4" aria-hidden />
                ) : (
                  <ArrowDown className="h-4 w-4" aria-hidden />
                )}
              </button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-11 w-11 min-h-11 shrink-0 px-0"
                disabled={index === 0}
                aria-label={labels.sortMoveUp}
                title={labels.sortMoveUp}
                onClick={() => onChange(moveAdminUsersSortCriterion(criteria, criterion.key, -1))}
              >
                <ChevronUp className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-11 w-11 min-h-11 shrink-0 px-0"
                disabled={index === criteria.length - 1}
                aria-label={labels.sortMoveDown}
                title={labels.sortMoveDown}
                onClick={() => onChange(moveAdminUsersSortCriterion(criteria, criterion.key, 1))}
              >
                <ChevronDown className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-11 w-11 min-h-11 shrink-0 px-0"
                disabled={criteria.length === 1}
                aria-label={labels.sortRemoveCriterion}
                title={labels.sortRemoveCriterion}
                onClick={() => onChange(setAdminUsersSortChecked(criteria, criterion.key, false))}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      {canAdd ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 min-h-11"
          onClick={() => onChange(addAdminUsersSortCriterion(criteria, sortKeys))}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {labels.sortAddCriterion}
        </Button>
      ) : null}
    </section>
  );
}
