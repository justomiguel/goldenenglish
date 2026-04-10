import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { ImportStudents } from "@/components/organisms/ImportStudents";

interface AdminImportScreenDesktopProps {
  dict: Dictionary;
  locale: string;
}

export function AdminImportScreenDesktop({
  dict,
  locale,
}: AdminImportScreenDesktopProps) {
  return (
    <main className="min-h-screen bg-[var(--color-muted)] px-4 py-10">
      <div className="mx-auto max-w-[var(--layout-max-width)] py-6">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-secondary)]">
          {dict.admin.import.title}
        </h1>
        <ImportStudents labels={dict.admin.import} />
      </div>
    </main>
  );
}
