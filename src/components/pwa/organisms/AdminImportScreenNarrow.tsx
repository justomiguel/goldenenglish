"use client";

import type { Dictionary } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import { ImportStudents } from "@/components/organisms/ImportStudents";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";

interface AdminImportScreenNarrowProps {
  dict: Dictionary;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  embedded?: boolean;
}

export function AdminImportScreenNarrow({
  dict,
  surface,
  embedded = false,
}: AdminImportScreenNarrowProps) {
  const form = (
    <div className="-mx-1 max-w-xl">
      <ImportStudents labels={dict.admin.import} />
    </div>
  );
  if (embedded) {
    return form;
  }
  return (
    <PwaPageShell surface={surface}>
      <main className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] py-4">
          <h1 className="mb-4 text-xl font-bold text-[var(--color-secondary)]">
            {dict.admin.import.title}
          </h1>
          {form}
        </div>
      </main>
    </PwaPageShell>
  );
}
