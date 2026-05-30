"use client";

import { useState } from "react";
import { Languages, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { setGoogleTranslateCredentialsAction } from "@/app/[locale]/dashboard/admin/settings/actions";

interface GoogleTranslateSettingsFormProps {
  locale: string;
  labels: {
    title: string;
    hint: string;
    inputLabel: string;
    inputPlaceholder: string;
    save: string;
    saved: string;
    error: string;
    keyMaskedPrefix: string;
    keyNotConfigured: string;
  };
  initialMaskedKey: string;
}

export function GoogleTranslateSettingsForm({
  locale,
  labels,
  initialMaskedKey,
}: GoogleTranslateSettingsFormProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [maskedKey, setMaskedKey] = useState(initialMaskedKey);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setMsg(null);
    setSaving(true);
    const result = await setGoogleTranslateCredentialsAction({
      locale,
      apiKey: value,
    });
    setSaving(false);
    if (!result.ok) {
      setMsg(labels.error);
      return;
    }
    setMaskedKey(result.maskedKey ?? "");
    setValue("");
    setMsg(labels.saved);
    router.refresh();
  }

  return (
    <section className="mt-6 max-w-2xl rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <div className="flex items-center gap-2">
        <Languages aria-hidden className="h-4 w-4" />
        <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.title}</h2>
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{labels.hint}</p>
      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
        {maskedKey ? `${labels.keyMaskedPrefix} ${maskedKey}` : labels.keyNotConfigured}
      </p>
      <label className="mt-4 flex flex-col gap-2 text-sm">
        <span className="font-medium text-[var(--color-foreground)]">{labels.inputLabel}</span>
        <input
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          type="password"
          value={value}
          placeholder={labels.inputPlaceholder}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-70"
        onClick={onSave}
        disabled={saving}
      >
        <Save aria-hidden className="h-4 w-4" />
        {labels.save}
      </button>
      {msg ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </section>
  );
}
