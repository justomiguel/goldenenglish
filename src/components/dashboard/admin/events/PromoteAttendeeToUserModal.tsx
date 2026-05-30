"use client";

import { UserPlus } from "lucide-react";

interface PromoteAttendeeToUserModalProps {
  open: boolean;
  attendeeName: string;
  role: string;
  onRoleChange: (nextRole: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  labels: {
    title: string;
    submit: string;
    cancel: string;
    role: string;
  };
}

const ROLE_OPTIONS = ["student", "teacher", "parent", "assistant", "admin"] as const;

export function PromoteAttendeeToUserModal({
  open,
  attendeeName,
  role,
  onRoleChange,
  onClose,
  onSubmit,
  labels,
}: PromoteAttendeeToUserModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title} — {attendeeName}
        </h3>
        <label className="mt-3 block text-sm text-[var(--color-foreground)]">
          {labels.role}
          <select
            value={role}
            onChange={(event) => onRoleChange(event.currentTarget.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
