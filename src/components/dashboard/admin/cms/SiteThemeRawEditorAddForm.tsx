"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { isAllowedOverrideKey } from "@/lib/cms/buildRawPropertyRows";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["properties"];

export interface SiteThemeRawEditorAddFormProps {
  labels: Labels;
  /** Keys already present in the draft (to avoid duplicates). */
  existingKeys: ReadonlyArray<string>;
  disabled?: boolean;
  onAdd: (key: string, value: string) => void;
}

type LocalError = "key_invalid" | "key_duplicated" | "key_empty";

const KEY_PATTERN = /^[a-z][a-z0-9.]*[a-z0-9]$/u;

function validateKey(
  key: string,
  existingKeys: ReadonlyArray<string>,
): LocalError | null {
  if (!key) return "key_empty";
  if (!KEY_PATTERN.test(key)) return "key_invalid";
  if (!isAllowedOverrideKey(key)) return "key_invalid";
  if (existingKeys.includes(key)) return "key_duplicated";
  return null;
}

/**
 * Inline form for adding a new raw override (typically a key the defaults
 * file does not declare, e.g. `social.tiktok`). The action layer re-validates
 * the whole map, so this form is only responsible for fast UX feedback; the
 * hard contract lives in `cleanThemeOverridesForPersistence` + Zod.
 */
export function SiteThemeRawEditorAddForm({
  labels,
  existingKeys,
  disabled,
  onAdd,
}: SiteThemeRawEditorAddFormProps) {
  const baseId = useId();
  const keyInputId = `raw-add-key-${baseId}`;
  const valueInputId = `raw-add-value-${baseId}`;
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<LocalError | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    const validation = validateKey(trimmedKey, existingKeys);
    if (validation) {
      setError(validation);
      return;
    }
    if (!trimmedValue) {
      setError("key_empty");
      return;
    }
    onAdd(trimmedKey, trimmedValue);
    setKey("");
    setValue("");
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-secondary)]">
          {labels.addTitle}
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {labels.addLead}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label htmlFor={keyInputId} className="sr-only">
          {labels.addKeyLabel}
        </label>
        <Input
          id={keyInputId}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder={labels.addKeyPlaceholder}
          disabled={disabled}
          className="font-mono text-xs"
        />
        <label htmlFor={valueInputId} className="sr-only">
          {labels.addValueLabel}
        </label>
        <Input
          id={valueInputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={labels.addValuePlaceholder}
          disabled={disabled}
          className="font-mono text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={disabled}
        >
          <Plus aria-hidden className="mr-1 h-4 w-4" />
          {labels.addCta}
        </Button>
      </div>
      {error ? (
        <p
          role="alert"
          className="text-xs text-[var(--color-error)]"
        >
          {error === "key_duplicated"
            ? labels.addErrors.key_duplicated
            : error === "key_empty"
              ? labels.addErrors.key_empty
              : labels.addErrors.key_invalid}
        </p>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {labels.hintAllowList}
        </p>
      )}
    </form>
  );
}
