"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { Modal } from "@/components/atoms/Modal";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AdminStudentSearchHit } from "@/app/[locale]/dashboard/admin/academic/cohortActions";

export interface AdminCommandPaletteProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminCommandPalette"];
}

export function AdminCommandPalette({ locale, dict }: AdminCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<AdminStudentSearchHit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQ("");
      setHits([]);
    }
  };

  useEffect(() => {
    if (!open || q.trim().length < 2) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const r = await searchAdminStudentsAction(q.trim());
        setHits(r);
      })();
    }, 200);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const displayHits = !open || q.trim().length < 2 ? [] : hits;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleId="admin-cmdk-title"
      descriptionId="admin-cmdk-desc"
      title={dict.title}
      ariaLabel={dict.title}
      dialogClassName="max-w-lg"
    >
      <p id="admin-cmdk-desc" className="text-xs text-[var(--color-muted-foreground)]">
        {dict.hint}
      </p>
      <input
        className="mt-3 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={dict.placeholder}
        autoComplete="off"
        autoFocus
      />
      <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto text-sm">
        {displayHits.length === 0 && q.trim().length >= 2 ? (
          <li className="px-2 py-2 text-[var(--color-muted-foreground)]">{dict.empty}</li>
        ) : null}
        {displayHits.map((h) => (
          <li key={h.id}>
            <Link
              href={`/${locale}/dashboard/admin/users/${h.id}`}
              className="block rounded-[var(--layout-border-radius)] px-2 py-2 hover:bg-[var(--color-muted)]"
              onClick={() => setOpen(false)}
            >
              <span className="font-medium text-[var(--color-foreground)]">{h.label}</span>
              <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">{dict.openProfile}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
