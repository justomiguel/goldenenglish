"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academics/actions";

export type AdminHelpSearchDict = Dictionary["dashboard"]["adminCommandPalette"];

export interface AdminHelpSearchPanelProps {
  locale: string;
  dict: AdminHelpSearchDict;
  resetKey: number;
  onClose: () => void;
}

export function AdminHelpSearchPanel({ locale, dict, resetKey, onClose }: AdminHelpSearchPanelProps) {
  const router = useRouter();

  const onPick = useCallback(
    (hit: AdminStudentSearchHitLike) => {
      router.push(`/${locale}/dashboard/admin/users/${hit.id}`);
      onClose();
    },
    [locale, router, onClose],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.hint}</p>
      <AdminStudentSearchCombobox
        id="admin-command-palette-student"
        labelText={dict.comboboxLabel}
        placeholder={dict.placeholder}
        inputTitle={dict.studentSearchTooltip}
        minCharsHint={dict.searchMin}
        prefetchWhenEmptyOnFocus
        search={searchAdminStudentsAction}
        onPick={onPick}
        resetKey={resetKey}
      />
      <p className="text-xs text-[var(--color-muted-foreground)]">
        <Link
          href={`/${locale}/dashboard/admin/users`}
          className="font-medium text-[var(--color-primary)] hover:underline"
          onClick={onClose}
        >
          {dict.openUserList}
        </Link>
      </p>
    </div>
  );
}
