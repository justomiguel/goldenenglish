"use client";

import type { ParentHubUpdateRow } from "@/types/parentHub";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["parent"]["hub"];

export interface ParentHubUpdatesListProps {
  updates: ParentHubUpdateRow[];
  dict: HubDict;
}

export function ParentHubUpdatesList({ updates, dict }: ParentHubUpdatesListProps) {
  const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.updatesTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.updatesLead}</p>
      {updates.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.updatesEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {updates.map((u, i) => {
            const dateStr = u.reviewedAt ? df.format(new Date(u.reviewedAt)) : "";
            const line = dict.updateLine
              .replace("{date}", dateStr)
              .replace("{child}", u.childFirstName)
              .replace("{section}", u.newSectionName);
            return (
              <li
                key={`${u.reviewedAt}-${i}`}
                className="border-l-2 border-[var(--color-primary)] pl-3 text-sm text-[var(--color-foreground)]"
              >
                {line}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
