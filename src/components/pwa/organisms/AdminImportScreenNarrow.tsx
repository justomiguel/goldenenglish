"use client";

import type { Dictionary } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import { ImportUsers } from "@/components/organisms/ImportUsers";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
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
  const form = (
    <div className="-mx-1 max-w-xl">
      <ImportUsers locale={locale} labels={dict.admin.users.spreadsheet} />
    </div>
  );
  if (embedded) {
    return form;
  }
  return (
    <PwaPageShell surface={surface}>
      <main className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] py-4">
          <AdminPageHeader
            title={dict.admin.users.spreadsheet.importTitle}
            iconId="students"
          />
          <div className="mt-4">{form}</div>
        </div>
      </main>
    </PwaPageShell>
  );
}
