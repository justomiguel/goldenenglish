"use client";

import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";
import type { Dictionary } from "@/types/i18n";
import { SiteThemeRawEditorRow } from "./SiteThemeRawEditorRow";
import type { RawEditorDraft } from "./siteThemeRawEditorDraft";

type Labels = Dictionary["admin"]["cms"]["templates"]["properties"];

export interface SiteThemeRawEditorTableProps {
  labels: Labels;
  rows: ReadonlyArray<RawPropertyRow>;
  draft: RawEditorDraft;
  disabled?: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
  onRemove: (key: string) => void;
}

/**
 * Presentational table for the raw editor. Isolated from the shell so the
 * stateful container stays under the 250-line architecture limit and so the
 * table markup can be exercised in unit tests independently.
 */
export function SiteThemeRawEditorTable({
  labels,
  rows,
  draft,
  disabled,
  onChange,
  onReset,
  onRemove,
}: SiteThemeRawEditorTableProps) {
  const empty = rows.length === 0;
  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead className="bg-[var(--color-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <tr>
            <th scope="col" className="px-3 py-2">
              {labels.columnKey}
            </th>
            <th scope="col" className="px-3 py-2">
              {labels.columnDefault}
            </th>
            <th scope="col" className="px-3 py-2">
              {labels.columnOverride}
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              {labels.columnActions}
            </th>
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td
                colSpan={4}
                className="px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
              >
                {labels.emptyDefaults}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <SiteThemeRawEditorRow
                key={row.key}
                row={row}
                draftValue={
                  Object.prototype.hasOwnProperty.call(draft, row.key)
                    ? draft[row.key]
                    : null
                }
                labels={labels}
                disabled={disabled}
                onChange={onChange}
                onReset={onReset}
                onRemove={onRemove}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
