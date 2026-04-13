"use client";

import type { StudentHubTransferPing } from "@/types/studentHub";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

export interface StudentScheduleUpdateStripProps {
  pings: StudentHubTransferPing[];
  dict: HubDict;
}

export function StudentScheduleUpdateStrip({ pings, dict }: StudentScheduleUpdateStripProps) {
  if (pings.length === 0) return null;
  const latest = pings[0];
  const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  const when = latest.reviewedAt ? df.format(new Date(latest.reviewedAt)) : "";

  return (
    <div
      role="status"
      className="rounded-2xl border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/15 px-4 py-3 text-sm text-[var(--color-foreground)]"
    >
      <p className="font-semibold text-[var(--color-primary)]">{dict.scheduleUpdateTitle}</p>
      <p className="mt-1 text-[var(--color-muted-foreground)]">
        {dict.scheduleUpdateBody}
        {when ? ` (${when})` : ""}
      </p>
    </div>
  );
}
