import type { Dictionary } from "@/types/i18n";
import { ImportUsers } from "@/components/organisms/ImportUsers";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface AdminImportScreenDesktopProps {
  locale: string;
  dict: Dictionary;
  /** When true, only the form (e.g. under Users → Import users tab). */
  embedded?: boolean;
}

export function AdminImportScreenDesktop({
  locale,
  dict,
  embedded = false,
}: AdminImportScreenDesktopProps) {
  const form = (
    <ImportUsers locale={locale} labels={dict.admin.users.spreadsheet} />
  );
  if (embedded) {
    return form;
  }
  return (
    <main className="min-h-screen bg-[var(--color-muted)] px-4 py-10">
      <div className="mx-auto max-w-[var(--layout-max-width)] py-6">
        <AdminPageHeader
          title={dict.admin.users.spreadsheet.importTitle}
          iconId="students"
        />
        <div className="mt-6">{form}</div>
      </div>
    </main>
  );
}
