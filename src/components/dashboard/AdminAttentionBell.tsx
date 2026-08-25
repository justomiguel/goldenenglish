"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function AdminAttentionBell({
  locale,
  messagesCount,
  registrationsCount,
  messagesLabel,
  registrationsLabel,
  emptyLabel,
  ariaLabel,
}: {
  locale: string;
  messagesCount: number;
  registrationsCount: number;
  messagesLabel: string;
  registrationsLabel: string;
  emptyLabel: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const badge = messagesCount + registrationsCount;
  const base = `/${locale}/dashboard/admin`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" data-tour="admin-chrome-bell">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-muted)]"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {badge > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-secondary)] px-1 text-[0.6rem] font-bold leading-none text-[var(--color-secondary-foreground)]">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm shadow-lg"
        >
          {badge === 0 ? (
            <p className="px-2 py-3 text-[var(--color-muted-foreground)]">{emptyLabel}</p>
          ) : (
            <ul className="space-y-1">
              {messagesCount > 0 ? (
                <li>
                  <Link
                    role="menuitem"
                    href={`${base}/messages`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-muted)]"
                  >
                    <span>{messagesLabel}</span>
                    <span className="font-semibold">{messagesCount}</span>
                  </Link>
                </li>
              ) : null}
              {registrationsCount > 0 ? (
                <li>
                  <Link
                    role="menuitem"
                    href={`${base}/registrations`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-muted)]"
                  >
                    <span>{registrationsLabel}</span>
                    <span className="font-semibold">{registrationsCount}</span>
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
