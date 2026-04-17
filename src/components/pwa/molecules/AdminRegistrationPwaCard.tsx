"use client";

import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationPwaCardProps {
  locale: string;
  r: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  statusLabel: (status: string) => string;
  onAccept: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
}

export function AdminRegistrationPwaCard({
  locale,
  r,
  busy,
  labels,
  statusLabel,
  onAccept,
  onEdit,
  onDelete,
}: AdminRegistrationPwaCardProps) {
  const canAccept = r.status === "new";
  const birthDisplay = r.birth_date
    ? new Date(`${r.birth_date}T12:00:00`).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : labels.emptyValue;
  const receivedDisplay = r.created_at
    ? new Date(r.created_at).toLocaleString(locale)
    : labels.emptyValue;

  const deleteBtnClass =
    "min-h-[44px] border-2 border-[var(--color-error)] bg-[var(--color-surface)] p-0 text-[var(--color-error)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-surface))] hover:text-[var(--color-error)] focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

  return (
    <li className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm">
      <div className="space-y-2">
        <p className="break-words font-medium text-[var(--color-foreground)]">
          {r.first_name} {r.last_name}
        </p>
        <dl className="grid gap-1 text-sm text-[var(--color-muted-foreground)]">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="sr-only">{labels.email}</dt>
            <dd className="break-all">{r.email}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.dni}: </span>
              {r.dni}
            </span>
            <span>
              <span className="text-[var(--color-foreground)]">{labels.level}: </span>
              {formatRegistrationLevelInterestDisplay(labels, r.level_interest)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.birthDate}: </span>
              {birthDisplay}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <span>
              <span className="text-[var(--color-foreground)]">{labels.status}: </span>
              {r.status === "new" ? (
                <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--color-accent-foreground)]">
                  {labels.new}
                </span>
              ) : (
                statusLabel(r.status)
              )}
            </span>
            <span>
              <span className="text-[var(--color-foreground)]">{labels.received}: </span>
              {receivedDisplay}
            </span>
          </div>
        </dl>
        <div
          className={
            canAccept
              ? "grid w-full min-w-0 grid-cols-3 gap-2 pt-2"
              : "flex justify-end pt-2"
          }
        >
          {canAccept ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={labels.accept}
                title={labels.tipAccept}
                className="min-h-[44px] w-full border border-[color-mix(in_srgb,var(--color-secondary-foreground)_22%,transparent)] px-0"
                disabled={busy}
                onClick={() => onAccept(r)}
              >
                <UserPlus
                  className="h-5 w-5 text-[var(--color-secondary-foreground)]"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.editTitle}
                title={labels.tipEditRow}
                className="min-h-[44px] w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-0 hover:bg-[var(--color-muted)]"
                disabled={busy}
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-5 w-5 text-[var(--color-foreground)]" strokeWidth={2.25} aria-hidden />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.delete}
            title={labels.tipDeleteRow}
            className={`${deleteBtnClass} ${canAccept ? "w-full" : "min-w-[44px] shrink-0"}`}
            disabled={busy}
            onClick={() => onDelete(r)}
          >
            <Trash2 className="h-5 w-5 text-[var(--color-error)]" strokeWidth={2.25} aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
