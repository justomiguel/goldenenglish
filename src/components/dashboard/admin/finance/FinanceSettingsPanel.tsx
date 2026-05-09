"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import type { Dictionary } from "@/types/i18n";
import { setBillingCurrencyAction } from "@/app/[locale]/dashboard/admin/finance/billingSettingsActions";

type SettingsDict = Dictionary["admin"]["finance"]["settings"];

const SUGGESTED_CURRENCIES = [
  "ARS",
  "BRL",
  "CLP",
  "EUR",
  "MXN",
  "USD",
  "UYU",
] as const;

const ISO_4217_RE = /^[A-Z]{3}$/;

export interface FinanceSettingsPanelProps {
  currentCurrency: string;
  locale: string;
  dict: SettingsDict;
}

export function FinanceSettingsPanel({
  currentCurrency,
  locale,
  dict,
}: FinanceSettingsPanelProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState(currentCurrency);
  const [customMode, setCustomMode] = useState(
    !SUGGESTED_CURRENCIES.includes(currentCurrency as (typeof SUGGESTED_CURRENCIES)[number]),
  );
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  const currencyValid = ISO_4217_RE.test(currency.trim().toUpperCase());
  const hasChanges = currency.trim().toUpperCase() !== currentCurrency;

  const onSelectChange = (value: string) => {
    if (value === "__other__") {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    setCurrency(value);
    setSaveResult(null);
  };

  const handleSave = () => {
    if (!currencyValid || !hasChanges) return;
    setSaveResult(null);
    startTransition(async () => {
      const result = await setBillingCurrencyAction(locale, currency.trim().toUpperCase());
      setSaveResult(result.ok ? "success" : "error");
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {dict.title}
          </h2>
        </header>
        <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
          {dict.lead}
        </p>

        <div className="max-w-sm space-y-4">
          <div>
            <Label htmlFor="billing-currency">{dict.currencyLabel}</Label>
            <select
              id="billing-currency"
              value={
                customMode
                  ? "__other__"
                  : SUGGESTED_CURRENCIES.includes(
                        currency as (typeof SUGGESTED_CURRENCIES)[number],
                      )
                    ? currency
                    : "__other__"
              }
              onChange={(e) => onSelectChange(e.target.value)}
              disabled={isPending}
              className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              {SUGGESTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__other__">{dict.currencyOther}</option>
            </select>
            {customMode ? (
              <Input
                id="billing-currency-custom"
                className="mt-2"
                type="text"
                maxLength={3}
                minLength={3}
                pattern="[A-Za-z]{3}"
                placeholder="BOB"
                aria-label={dict.currencyOtherAria}
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value.toUpperCase());
                  setSaveResult(null);
                }}
                disabled={isPending}
              />
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-3 py-2 text-xs text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{dict.warningAffectsAll}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !currencyValid || !hasChanges}
              isLoading={isPending}
              className="min-h-[44px]"
            >
              {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {dict.save}
            </Button>
            {saveResult === "success" ? (
              <span className="text-sm text-[var(--color-success)]">{dict.savedOk}</span>
            ) : saveResult === "error" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.savedError}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
