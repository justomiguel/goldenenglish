"use client";

import type { Dictionary } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import { ImportUsers } from "@/components/organisms/ImportUsers";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface AdminImportScreenNarrowProps {
  locale: string;
  dict: Dictionary;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  embedded?: boolean;
}

export function AdminImportScreenNarrow({
  locale,
  dict,
  surface,
  embedded = false,
}: AdminImportScreenNarrowProps) {
  void surface;
  const form = (
    <div className="-mx-1 max-w-xl">
      <ImportUsers locale={locale} labels={dict.admin.users.spreadsheet} />
    </div>
  );
  if (embedded) {
    return form;
  }
  return (
    <main className="mx-auto max-w-[var(--layout-max-width)] space-y-3">
      <AdminPageHeader title={dict.admin.users.spreadsheet.importTitle} iconId="students" />
      {form}
    </main>
  );
}
