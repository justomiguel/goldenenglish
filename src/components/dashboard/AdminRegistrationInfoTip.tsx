"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";

export function AdminRegistrationInfoTip({
  text,
  label,
  onDark = false,
}: {
  text: string;
  label: string;
  onDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? "block" : "hidden group-hover:block group-focus-within:block";
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${label}. ${text}`}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          onDark
            ? "text-white hover:bg-[color-mix(in_srgb,black_28%,transparent)] focus-visible:outline-white"
            : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] focus-visible:outline-[var(--color-primary)]"
        }`}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={`absolute right-0 top-full z-20 mt-2 w-64 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-sm leading-relaxed text-[var(--color-foreground)] shadow-lg ${shown}`}
      >
        {text}
      </span>
    </span>
  );
}
