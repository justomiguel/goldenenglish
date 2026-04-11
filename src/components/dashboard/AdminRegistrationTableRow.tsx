"use client";

import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationTableRowProps {
  locale: string;
  r: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  statusLabel: (status: string) => string;
  onAccept: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
}

export function AdminRegistrationTableRow({
  locale,
  r,
  busy,
  labels,
  statusLabel,
  onAccept,
  onDelete,
}: AdminRegistrationTableRowProps) {
  const canAccept = r.status === "new";
  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="px-3 py-2 font-medium">
        {r.first_name} {r.last_name}
      </td>
      <td className="px-3 py-2">{r.dni}</td>
      <td className="px-3 py-2">{r.email}</td>
      <td className="px-3 py-2">{r.level_interest ?? "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap text-[var(--color-muted-foreground)]">
        {r.birth_date
          ? new Date(`${r.birth_date}T12:00:00`).toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—"}
      </td>
      <td className="px-3 py-2">
        {r.status === "new" ? (
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--color-accent-foreground)]">
            {labels.new}
          </span>
        ) : (
          statusLabel(r.status)
        )}
      </td>
      <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
      </td>
      <td className="px-3 py-2 align-middle">
        <div
          className={
            canAccept
              ? "grid w-full min-w-0 grid-cols-2 gap-2"
              : "flex justify-end"
          }
        >
          {canAccept ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label={labels.accept}
              title={labels.accept}
              className="min-h-[44px] min-w-[44px] shrink-0 border border-[color-mix(in_srgb,var(--color-secondary-foreground)_22%,transparent)] px-0"
              disabled={busy}
              onClick={() => onAccept(r)}
            >
              <UserPlus
                className="h-5 w-5 text-[var(--color-secondary-foreground)]"
                strokeWidth={2.25}
                aria-hidden
              />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.delete}
            title={labels.deleteConfirmTitle}
            className="min-h-[44px] min-w-[44px] shrink-0 border-2 border-[var(--color-error)] bg-[var(--color-surface)] p-0 text-[var(--color-error)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-surface))] hover:text-[var(--color-error)] focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            disabled={busy}
            onClick={() => onDelete(r)}
          >
            <Trash2
              className="h-5 w-5 text-[var(--color-error)]"
              strokeWidth={2.25}
              aria-hidden
            />
          </Button>
        </div>
      </td>
    </tr>
  );
}
