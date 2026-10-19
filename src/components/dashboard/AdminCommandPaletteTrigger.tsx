"use client";

import { Search } from "lucide-react";

export const ADMIN_COMMAND_PALETTE_OPEN_EVENT = "ge:admin-command-palette-open";

export function openAdminCommandPalette() {
  window.dispatchEvent(new Event(ADMIN_COMMAND_PALETTE_OPEN_EVENT));
}

interface AdminCommandPaletteTriggerProps {
  label: string;
}

/** Visible chrome control so touch users can open the student search palette. */
export function AdminCommandPaletteTrigger({ label }: AdminCommandPaletteTriggerProps) {
  return (
    <button
      type="button"
      onClick={openAdminCommandPalette}
      aria-label={label}
      title={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
    >
      <Search className="h-4 w-4" aria-hidden strokeWidth={2} />
    </button>
  );
}
