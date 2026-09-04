"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMerchEnabled } from "@/app/[locale]/dashboard/admin/settings/setMerchEnabled";
import type { Dictionary } from "@/types/i18n";

interface MerchSettingsFormProps {
  locale: string;
  initialEnabled: boolean;
  labels: Dictionary["admin"]["settings"];
}

export function MerchSettingsForm({
  locale,
  initialEnabled,
  labels,
}: MerchSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onToggle(next: boolean) {
    setMsg(null);
    const res = await setMerchEnabled(locale, next);
    if (res.ok) {
      setEnabled(next);
      setMsg(labels.saved);
      router.refresh();
    } else {
      setMsg(labels.error);
    }
  }

  return (
    <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold text-[var(--color-primary)]">
        {labels.merch}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {labels.merchHint}
      </p>
      <label
        className="mt-6 flex cursor-pointer items-center gap-3"
        title={labels.merchToggleTooltip}
      >
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[var(--color-border)]"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="font-medium text-[var(--color-foreground)]">
          {labels.merch}
        </span>
      </label>
      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p>
      ) : null}
    </div>
  );
}
