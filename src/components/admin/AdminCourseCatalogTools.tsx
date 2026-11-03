"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, ListPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminCourseProgramForms } from "@/components/admin/AdminCourseProgramForms";
import { createCourseCategoryAction, createCourseFieldAction } from "@/app/[locale]/dashboard/admin/academic/contents/catalogActions";
import type { CourseCatalogSetup } from "@/lib/courses/loadCourseCatalogSetup";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];
const fieldClass =
  "block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

interface AdminCourseCatalogToolsProps {
  locale: string;
  catalog: CourseCatalogSetup;
  sections: { id: string; name: string }[];
  labels: Labels;
}

export function AdminCourseCatalogTools({ locale, catalog, sections, labels }: AdminCourseCatalogToolsProps) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  async function run(task: () => Promise<{ ok: boolean }>) {
    setPending(true);
    setFailed(false);
    const result = await task();
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <CategoryForm locale={locale} catalog={catalog} labels={labels} pending={pending} onRun={run} />
      <FieldForm locale={locale} labels={labels} pending={pending} onRun={run} />
      <AdminCourseProgramForms locale={locale} catalog={catalog} sections={sections} labels={labels} pending={pending} onRun={run} />
      {failed ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {labels.catalogSaveFailed}
        </p>
      ) : null}
    </div>
  );
}

function CategoryForm({
  locale,
  catalog,
  labels,
  pending,
  onRun,
}: {
  locale: string;
  catalog: CourseCatalogSetup;
  labels: Labels;
  pending: boolean;
  onRun: (task: () => Promise<{ ok: boolean }>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onRun(async () => {
          const result = await createCourseCategoryAction({ locale, name, parentId: parentId || null });
          if (result.ok) {
            setName("");
            setParentId("");
          }
          return result;
        });
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogCategoryName}
        <input required className={fieldClass} value={name} maxLength={120} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogCategoryParent}
        <select className={fieldClass} value={parentId} onChange={(event) => setParentId(event.target.value)}>
          <option value="">{labels.catalogCategoryNone}</option>
          {catalog.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        <FolderPlus className="h-4 w-4" aria-hidden />
        {labels.catalogCategoryCreate}
      </Button>
    </form>
  );
}

function FieldForm({
  locale,
  labels,
  pending,
  onRun,
}: {
  locale: string;
  labels: Labels;
  pending: boolean;
  onRun: (task: () => Promise<{ ok: boolean }>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"text" | "dropdown" | "checkbox" | "date">("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onRun(async () => {
          const result = await createCourseFieldAction({ locale, name, kind, required, options });
          if (result.ok) {
            setName("");
            setOptions("");
            setRequired(false);
          }
          return result;
        });
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogFieldName}
        <input required className={fieldClass} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogFieldKind}
        <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
          <option value="text">{labels.catalogFieldText}</option>
          <option value="dropdown">{labels.catalogFieldDropdown}</option>
          <option value="checkbox">{labels.catalogFieldCheckbox}</option>
          <option value="date">{labels.catalogFieldDate}</option>
        </select>
      </label>
      {kind === "dropdown" ? (
        <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
          {labels.catalogFieldOptions}
          <textarea className={fieldClass} value={options} maxLength={2000} onChange={(event) => setOptions(event.target.value)} />
        </label>
      ) : null}
      <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
        {labels.catalogFieldRequired}
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        <ListPlus className="h-4 w-4" aria-hidden />
        {labels.catalogFieldCreate}
      </Button>
    </form>
  );
}
