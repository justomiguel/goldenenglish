"use client";

import { useId } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["properties"];

export interface SiteThemeRawEditorRowProps {
  row: RawPropertyRow;
  /** Current value as held in the local draft. `null` when no override. */
  draftValue: string | null;
  labels: Labels;
  disabled?: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
  onRemove: (key: string) => void;
}

/**
 * A single raw property row. Renders the key, the default value (read-only
 * helper), and the current override. Exposes two affordances:
 *  - Reset: writes the default into the draft (so saving clears the override).
 *  - Remove: drops the override entirely (only enabled for keys with no
 *    declared default, i.e. long-tail overrides the grouped editor cannot show).
 */
export function SiteThemeRawEditorRow({
  row,
  draftValue,
  labels,
  disabled,
  onChange,
  onReset,
  onRemove,
}: SiteThemeRawEditorRowProps) {
  const fieldId = useId();
  const value = draftValue ?? "";
  const hasDefault = row.defaultValue !== null;
  const canRemove = !hasDefault && draftValue !== null;

  return (
    <tr className="border-t border-[var(--color-border)] align-top">
      <td className="px-3 py-2 font-mono text-xs text-[var(--color-foreground)]">
        <label htmlFor={fieldId} className="break-all">
          {row.key}
        </label>
      </td>
      <td className="px-3 py-2 font-mono text-xs text-[var(--color-muted-foreground)]">
        {hasDefault ? (
          <span className="break-all">{row.defaultValue}</span>
        ) : (
          <span className="italic">{labels.missingDefaultLabel}</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1.5">
          <Input
            id={fieldId}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(row.key, event.target.value)}
            placeholder={hasDefault ? row.defaultValue ?? "" : ""}
            className="font-mono text-xs"
          />
          {row.isOverridden ? (
            <span className="inline-flex w-max rounded-[var(--layout-border-radius)] bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {labels.overriddenLabel}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2 text-right text-xs">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasDefault ? (
            <button
              type="button"
              onClick={() => onReset(row.key)}
              disabled={disabled}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] px-2 py-1 text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-50"
              title={labels.resetRowCta}
              aria-label={labels.resetRowCta}
            >
              <Undo2 aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.resetRowCta}
            </button>
          ) : null}
          {canRemove ? (
            <button
              type="button"
              onClick={() => onRemove(row.key)}
              disabled={disabled}
              className="inline-flex items-center rounded-[var(--layout-border-radius)] px-2 py-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-50"
              title={labels.removeRowCta}
              aria-label={labels.removeRowCta}
            >
              <Trash2 aria-hidden className="mr-1 h-3.5 w-3.5" />
              {labels.removeRowCta}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
