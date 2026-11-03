"use client";

import type { CourseFieldFormOption } from "@/lib/courses/loadCourseCatalogSetup";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

export type CourseFieldDraft = { text: string; optionId: string; checked: boolean; date: string };

export function mergeFieldDraft(current: CourseFieldDraft | undefined, patch: Partial<CourseFieldDraft>): CourseFieldDraft {
  return {
    text: patch.text ?? current?.text ?? "",
    optionId: patch.optionId ?? current?.optionId ?? "",
    checked: patch.checked ?? current?.checked ?? false,
    date: patch.date ?? current?.date ?? "",
  };
}

export function courseFieldPayload(fields: CourseFieldFormOption[], drafts: Record<string, CourseFieldDraft>) {
  return fields.map((field) => {
    const draft = drafts[field.id] ?? { text: "", optionId: "", checked: false, date: "" };
    return {
      fieldId: field.id,
      text: draft.text || undefined,
      optionId: draft.optionId || undefined,
      checked: field.kind === "checkbox" ? draft.checked : undefined,
      date: draft.date || undefined,
    };
  });
}

const fieldClass =
  "block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

interface AdminCourseTaxonomyFieldsProps {
  labels: Labels;
  categories: { id: string; name: string }[];
  fields: CourseFieldFormOption[];
  categoryId: string;
  hashtags: string;
  drafts: Record<string, CourseFieldDraft>;
  onCategoryId: (value: string) => void;
  onHashtags: (value: string) => void;
  onDraft: (fieldId: string, patch: Partial<CourseFieldDraft>) => void;
}

export function AdminCourseTaxonomyFields({
  labels,
  categories,
  fields,
  categoryId,
  hashtags,
  drafts,
  onCategoryId,
  onHashtags,
  onDraft,
}: AdminCourseTaxonomyFieldsProps) {
  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogCategory}
        <select className={fieldClass} value={categoryId} onChange={(event) => onCategoryId(event.target.value)}>
          <option value="">{labels.catalogCategoryNone}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogHashtags}
        <input
          className={fieldClass}
          value={hashtags}
          maxLength={400}
          placeholder={labels.catalogHashtagsHint}
          onChange={(event) => onHashtags(event.target.value)}
        />
      </label>
      {fields.map((field) => {
        const draft = drafts[field.id] ?? { text: "", optionId: "", checked: false, date: "" };
        return (
          <label key={field.id} className="block space-y-1 text-sm text-[var(--color-foreground)]">
            {field.name}
            {field.kind === "text" ? (
              <input className={fieldClass} value={draft.text} maxLength={500} onChange={(event) => onDraft(field.id, { text: event.target.value })} />
            ) : null}
            {field.kind === "dropdown" ? (
              <select className={fieldClass} value={draft.optionId} onChange={(event) => onDraft(field.id, { optionId: event.target.value })}>
                <option value="">{labels.catalogCategoryNone}</option>
                {field.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            {field.kind === "checkbox" ? (
              <input type="checkbox" checked={draft.checked} onChange={(event) => onDraft(field.id, { checked: event.target.checked })} />
            ) : null}
            {field.kind === "date" ? (
              <input className={fieldClass} type="date" value={draft.date} onChange={(event) => onDraft(field.id, { date: event.target.value })} />
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
