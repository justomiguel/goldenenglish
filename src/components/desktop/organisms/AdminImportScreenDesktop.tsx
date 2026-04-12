import type { Dictionary } from "@/types/i18n";
import { ImportStudents } from "@/components/organisms/ImportStudents";

interface AdminImportScreenDesktopProps {
  dict: Dictionary;
  /** When true, only the form (e.g. under Usuarios → Importar CSV tab). */
  embedded?: boolean;
}

export function AdminImportScreenDesktop({
  dict,
  embedded = false,
}: AdminImportScreenDesktopProps) {
  const form = <ImportStudents labels={dict.admin.import} />;
  if (embedded) {
    return form;
  }
  return (
    <main className="min-h-screen bg-[var(--color-muted)] px-4 py-10">
      <div className="mx-auto max-w-[var(--layout-max-width)] py-6">
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-secondary)]">
          {dict.admin.import.title}
        </h1>
        {form}
      </div>
    </main>
  );
}
