"use client";

import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["parent"]["hub"];

export interface ParentHubIcsDownloadProps {
  icsDocument: string;
  dict: HubDict;
}

export function ParentHubIcsDownload({ icsDocument, dict }: ParentHubIcsDownloadProps) {
  const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsDocument)}`;
  return (
    <a
      href={href}
      download={dict.icsFilename}
      className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm font-medium text-[var(--color-primary)]"
    >
      {dict.downloadIcs}
    </a>
  );
}
