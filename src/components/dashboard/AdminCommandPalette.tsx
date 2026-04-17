"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Modal } from "@/components/atoms/Modal";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";

export interface AdminCommandPaletteProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminCommandPalette"];
}

export function AdminCommandPalette({ locale, dict }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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
    if (!next) setResetKey((k) => k + 1);
  };

  const onPick = useCallback(
    (hit: AdminStudentSearchHitLike) => {
      router.push(`/${locale}/dashboard/admin/users/${hit.id}`);
      handleOpenChange(false);
    },
    [locale, router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.fabAria}
        title={dict.fabTitle}
        className="fixed bottom-5 right-5 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 md:bottom-8 md:right-8 md:inline-flex"
      >
        <Search className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
      </button>

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
        <div className="mt-3">
          <AdminStudentSearchCombobox
            id="admin-command-palette-student"
            labelText={dict.comboboxLabel}
            placeholder={dict.placeholder}
            inputTitle={dict.studentSearchTooltip}
            minCharsHint={dict.searchMin}
            search={searchAdminStudentsAction}
            onPick={onPick}
            resetKey={resetKey}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          <Link
            href={`/${locale}/dashboard/admin/users`}
            className="font-medium text-[var(--color-primary)] hover:underline"
            onClick={() => handleOpenChange(false)}
          >
            {dict.openUserList}
          </Link>
        </p>
      </Modal>
    </>
  );
}
