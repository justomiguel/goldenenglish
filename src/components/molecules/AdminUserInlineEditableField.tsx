"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailUpdatableField } from "@/lib/dashboard/adminUserDetailUpdateParse";
import { updateAdminUserDetailFieldAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserInlineEditableFieldProps {
  locale: string;
  userId: string;
  field: AdminUserDetailUpdatableField;
  label: string;
  displayValue: string;
  editInitial: string;
  editable: boolean;
  inputKind: "text" | "email" | "tel" | "date" | "select";
  selectOptions?: { value: string; label: string }[];
  labels: UserLabels;
  onFeedback: (message: string, ok: boolean) => void;
}

export function AdminUserInlineEditableField({
  locale,
  userId,
  field,
  label,
  displayValue,
  editInitial,
  editable,
  inputKind,
  selectOptions,
  labels,
  onFeedback,
}: AdminUserInlineEditableFieldProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editInitial);
  const [busy, setBusy] = useState(false);

  const startEdit = useCallback(() => {
    setDraft(editInitial);
    setEditing(true);
  }, [editInitial]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(editInitial);
  }, [editInitial]);

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const r = await updateAdminUserDetailFieldAction({
        locale,
        targetUserId: userId,
        field,
        value: draft,
      });
      if (r.ok) {
        onFeedback(r.message ?? labels.detailToastSaved, true);
        setEditing(false);
        router.refresh();
      } else {
        onFeedback(r.message ?? labels.detailErrSave, false);
      }
    } finally {
      setBusy(false);
    }
  }, [draft, field, labels.detailErrSave, labels.detailToastSaved, locale, onFeedback, router, userId]);

  const valueButtonClass =
    "group flex w-full min-h-[44px] items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-transparent px-1 text-left text-sm text-[var(--color-foreground)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

  return (
    <div className="border-b border-[var(--color-border)] py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</dt>
      {editing ? (
        <dd className="mt-2 space-y-2">
          {inputKind === "select" && selectOptions ? (
            <select
              className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={label}
            >
              {selectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type={inputKind === "date" ? "date" : inputKind}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={label}
              className="w-full"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={busy}
              onClick={() => void save()}
              className="gap-1.5"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {labels.detailConfirmSave}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={cancel} className="gap-1.5">
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {labels.detailCancelEdit}
            </Button>
          </div>
        </dd>
      ) : (
        <dd className="mt-1">
          {editable ? (
            <button type="button" className={valueButtonClass} onClick={startEdit} aria-label={`${labels.detailEditFieldPrefix} ${label}`}>
              <span className="min-w-0 break-words">{displayValue}</span>
              <Pencil
                className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] opacity-70 group-hover:opacity-100"
                aria-hidden
              />
            </button>
          ) : (
            <span className="text-sm text-[var(--color-foreground)]">{displayValue}</span>
          )}
        </dd>
      )}
    </div>
  );
}
