"use client";

import { useState } from "react";
import { setInscriptionsEnabled } from "@/app/[locale]/dashboard/admin/settings/actions";
import type { Dictionary } from "@/types/i18n";

interface InscriptionsSettingsFormProps {
  locale: string;
  initialEnabled: boolean;
  labels: Dictionary["admin"]["settings"];
}

export function InscriptionsSettingsForm({
  locale,
  initialEnabled,
  labels,
}: InscriptionsSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [msg, setMsg] = useState<string | null>(null);

  async function onToggle(next: boolean) {
    setMsg(null);
    const res = await setInscriptionsEnabled(locale, next);
    if (res.ok) {
      setEnabled(next);
      setMsg(labels.saved);
    } else {
      setMsg(labels.error);
    }
  }

  return (
    <div className="max-w-lg rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
        {labels.title}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {labels.inscriptionsHint}
      </p>
      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[var(--color-border)]"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="font-medium text-[var(--color-foreground)]">
          {labels.inscriptions}
        </span>
      </label>
      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p>
      ) : null}
    </div>
  );
}
