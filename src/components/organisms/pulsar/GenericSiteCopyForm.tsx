"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveGenericSiteCopyAction } from "@/app/[locale]/dashboard/admin/cms/saveGenericSiteCopyAction";
import { Button } from "@/components/atoms/Button";
import type { GenericSiteCopyField } from "@/lib/landing/genericSiteCopyFields";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["pulsar"]["account"]["siteCopy"];

export function GenericSiteCopyForm({
  locale,
  themeId,
  fields,
  labels,
}: {
  locale: string;
  themeId: string;
  fields: readonly GenericSiteCopyField[];
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const groups = groupFields(fields);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await saveGenericSiteCopyAction({
      id: themeId,
      locale,
      fields: fields.map((field) => ({
        key: field.key,
        value: String(data.get(field.key) ?? ""),
      })),
    });
    setPending(false);
    if (!result.ok) {
      setError(labels.emptyName);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-medium">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      {groups.map((group) => (
        <fieldset key={group.id} className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <legend className="text-base font-semibold">{group.title}</legend>
          {group.fields.map((field) => (
            <label key={field.key} className="block text-sm font-semibold">
              {field.label}
              {field.multiline ? (
                <textarea
                  name={field.key}
                  required={field.required}
                  defaultValue={field.value}
                  rows={3}
                  className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-normal"
                />
              ) : (
                <input
                  name={field.key}
                  required={field.required}
                  defaultValue={field.value}
                  className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-normal"
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
      {saved ? <p className="text-sm">{labels.saved}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </form>
  );
}

function groupFields(fields: readonly GenericSiteCopyField[]) {
  const groups: Array<{ id: string; title: string; fields: GenericSiteCopyField[] }> = [];
  for (const field of fields) {
    const current = groups.at(-1);
    if (!current || current.id !== field.group) {
      groups.push({ id: field.group, title: field.label.split(" — ")[0] || field.group, fields: [field] });
    } else {
      current.fields.push(field);
    }
  }
  return groups;
}
