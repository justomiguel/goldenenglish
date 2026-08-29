"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPublicCtaMode } from "@/app/[locale]/dashboard/admin/settings/publicCtaModeActions";
import type { Dictionary } from "@/types/i18n";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

const OPTIONS: PublicCtaMode[] = ["reserve", "trial", "both"];

interface PublicCtaModeSettingsFormProps {
  locale: string;
  initialMode: PublicCtaMode;
  labels: Dictionary["admin"]["settings"];
}

export function PublicCtaModeSettingsForm({
  locale,
  initialMode,
  labels,
}: PublicCtaModeSettingsFormProps) {
  const [mode, setMode] = useState<PublicCtaMode>(initialMode);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onPick(next: PublicCtaMode) {
    setMsg(null);
    const res = await setPublicCtaMode(locale, next);
    if (res.ok) {
      setMode(next);
      setMsg(labels.saved);
      router.refresh();
    } else {
      setMsg(labels.error);
    }
  }

  const optionLabel: Record<PublicCtaMode, string> = {
    reserve: labels.publicCtaReserve,
    trial: labels.publicCtaTrial,
    both: labels.publicCtaBoth,
  };

  return (
    <div className="mt-8 max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold text-[var(--color-primary)]">
        {labels.publicCtaTitle}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {labels.publicCtaHint}
      </p>
      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">{labels.publicCtaTitle}</legend>
        {OPTIONS.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="public-cta-mode"
              className="h-4 w-4 border-[var(--color-border)]"
              checked={mode === value}
              onChange={() => onPick(value)}
            />
            <span className="font-medium text-[var(--color-foreground)]">
              {optionLabel[value]}
            </span>
          </label>
        ))}
      </fieldset>
      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p>
      ) : null}
    </div>
  );
}
