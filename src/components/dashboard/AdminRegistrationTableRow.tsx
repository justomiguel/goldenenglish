"use client";

import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationTableRowProps {
  locale: string;
  r: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  statusLabel: (status: string) => string;
  onAccept: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
}

export function AdminRegistrationTableRow({
  locale,
  r,
  busy,
  labels,
  onAccept,
  onEdit,
  onDelete,
}: AdminRegistrationTableRowProps) {
  const canAccept = r.status === "new";
  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top font-medium">
        {formatProfileNameSurnameFirst(r.first_name, r.last_name)}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">{r.dni}</td>
      <td className="min-w-0 max-w-0 break-all px-3 py-2 align-top">{r.email}</td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top">
        {formatRegistrationLevelInterestDisplay(labels, r.level_interest)}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top text-[var(--color-muted-foreground)]">
        {r.birth_date
          ? new Date(`${r.birth_date}T12:00:00`).toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : labels.emptyValue}
      </td>
      <td className="min-w-0 max-w-0 break-words px-3 py-2 align-top text-[var(--color-muted-foreground)]">
        {r.created_at ? new Date(r.created_at).toLocaleString() : labels.emptyValue}
      </td>
      <td className="min-w-0 px-3 py-2 align-top">
        <div className="flex items-center justify-end gap-2">
          {canAccept ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={labels.accept}
                title={labels.tipAccept}
                className="h-9 w-9 shrink-0 p-0"
                disabled={busy}
                onClick={() => onAccept(r)}
              >
                <UserPlus
                  className="h-4 w-4 shrink-0 text-[var(--color-secondary-foreground)]"
                  strokeWidth={2}
                  aria-hidden
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.editTitle}
                title={labels.tipEditRow}
                className="h-9 w-9 shrink-0 border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                disabled={busy}
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-4 w-4 shrink-0 text-[var(--color-foreground)]" strokeWidth={2} aria-hidden />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.delete}
            title={labels.tipDeleteRow}
            className="h-9 w-9 shrink-0 border border-[var(--color-error)] bg-[var(--color-surface)] p-0 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-surface))] hover:text-[var(--color-error)] focus-visible:ring-2 focus-visible:ring-[var(--color-error)]"
            disabled={busy}
            onClick={() => onDelete(r)}
          >
            <Trash2
              className="h-4 w-4 shrink-0 text-[var(--color-error)]"
              strokeWidth={2}
              aria-hidden
            />
          </Button>
        </div>
      </td>
    </tr>
  );
}
