"use client";

import type { ParentHubLogisticsRow } from "@/types/parentHub";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["parent"]["hub"];

export interface ParentHubLogisticsTableProps {
  rows: ParentHubLogisticsRow[];
  scheduleOverlap: boolean;
  dict: HubDict;
}

export function ParentHubLogisticsTable({ rows, scheduleOverlap, dict }: ParentHubLogisticsTableProps) {
  if (rows.length === 0) {
    return (
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.logisticsTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.logisticsEmpty}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.logisticsTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.logisticsLead}</p>
      {scheduleOverlap ? (
        <p className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-error)]">
          {dict.overlapWarning}
        </p>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
              <th className="py-2 pr-4 font-medium">{dict.colChild}</th>
              <th className="py-2 pr-4 font-medium">{dict.colClass}</th>
              <th className="py-2 pr-4 font-medium">{dict.colSchedule}</th>
              <th className="py-2 font-medium">{dict.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.studentId}-${r.classLabel}`} className="border-b border-[var(--color-border)] last:border-0">
                <td className="py-2 pr-4 align-top text-[var(--color-foreground)]">{r.childLabel}</td>
                <td className="py-2 pr-4 align-top text-[var(--color-foreground)]">{r.classLabel}</td>
                <td className="py-2 pr-4 align-top text-[var(--color-muted-foreground)]">{r.scheduleHuman || dict.emptySchedule}</td>
                <td className="py-2 align-top">
                  {r.active ? (
                    <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
                      {dict.statusActive}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-muted-foreground)]">{dict.statusOther}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
