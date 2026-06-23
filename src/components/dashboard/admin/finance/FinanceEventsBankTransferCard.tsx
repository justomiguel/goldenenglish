"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import { setEventsBankTransferEnabledAction } from "@/app/[locale]/dashboard/admin/finance/billingSettingsActions";

type SettingsDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceEventsBankTransferCardProps {
  locale: string;
  initialEnabled: boolean;
  dict: SettingsDict;
}

export function FinanceEventsBankTransferCard({
  locale,
  initialEnabled,
  dict,
}: FinanceEventsBankTransferCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  const hasChanges = enabled !== initialEnabled;

  const handleSave = () => {
    if (!hasChanges) return;
    setSaveResult(null);
    startTransition(async () => {
      const result = await setEventsBankTransferEnabledAction(locale, enabled);
      setSaveResult(result.ok ? "success" : "error");
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <header className="mb-4 flex items-center gap-2">
        <Landmark className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {dict.eventsBankTransferTitle}
        </h2>
      </header>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        {dict.eventsBankTransferLead}
      </p>

      <div className="max-w-2xl space-y-4">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              setSaveResult(null);
            }}
            disabled={isPending}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          {dict.eventsBankTransferToggle}
        </label>

        <p className="text-xs text-[var(--color-muted-foreground)]">
          {dict.eventsBankTransferHint}
        </p>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            isLoading={isPending}
            className="min-h-[44px]"
          >
            {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.eventsBankTransferSave}
          </Button>
          {saveResult === "success" ? (
            <span className="text-sm text-[var(--color-success)]">
              {dict.eventsBankTransferSavedOk}
            </span>
          ) : saveResult === "error" ? (
            <span className="text-sm text-[var(--color-error)]">
              {dict.eventsBankTransferSavedError}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
