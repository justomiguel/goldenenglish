"use client";

import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import type { ThemePreviewTokens } from "@/lib/cms/themePreviewTokens";
import { SiteThemeTemplatePreviewCard } from "./SiteThemeTemplatePreviewCard";

type Labels = Dictionary["admin"]["cms"]["templates"];

export interface SiteThemeTemplatesGridProps {
  locale: string;
  labels: Labels;
  rows: SiteThemeRow[];
  tokensByThemeId: Readonly<Record<string, ThemePreviewTokens>>;
  brandName: string;
  pending: boolean;
  onActivate: (row: SiteThemeRow) => void;
  onRename: (row: SiteThemeRow) => void;
  onDuplicate: (row: SiteThemeRow) => void;
  onArchive: (row: SiteThemeRow) => void;
  onRestore: (row: SiteThemeRow) => void;
}

export function SiteThemeTemplatesGrid({
  locale,
  labels,
  rows,
  tokensByThemeId,
  brandName,
  pending,
  onActivate,
  onRename,
  onDuplicate,
  onArchive,
  onRestore,
}: SiteThemeTemplatesGridProps) {
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label={labels.preview.gridAriaLabel}
    >
      {rows.map((row) => {
        const tokens = tokensByThemeId[row.id];
        if (!tokens) return null;
        return (
          <li key={row.id}>
            <SiteThemeTemplatePreviewCard
              locale={locale}
              labels={labels}
              row={row}
              tokens={tokens}
              brandName={brandName}
              pending={pending}
              onActivate={onActivate}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          </li>
        );
      })}
    </ul>
  );
}
