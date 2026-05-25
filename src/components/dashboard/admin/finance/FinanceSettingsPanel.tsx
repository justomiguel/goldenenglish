"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import { setBillingCurrencyAction } from "@/app/[locale]/dashboard/admin/finance/billingSettingsActions";
import { FinanceFlowGatewayCard } from "@/components/dashboard/admin/finance/FinanceFlowGatewayCard";
import { FinanceMercadoPagoGatewayCard } from "@/components/dashboard/admin/finance/FinanceMercadoPagoGatewayCard";
import { BillingCurrencySelectField } from "@/components/molecules/BillingCurrencySelectField";
import {
  ISO_4217_CURRENCY_RE,
  normalizeBillingCurrencyInput,
} from "@/lib/billing/billingCurrencyConstants";
import type { FlowChileAdminRowSafe } from "@/app/[locale]/dashboard/admin/finance/flowGatewaySettingsActions";
import type { MercadoPagoAdminRowSafe } from "@/app/[locale]/dashboard/admin/finance/mercadoPagoGatewaySettingsActions";

type SettingsDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceSettingsPanelProps {
  currentCurrency: string;
  locale: string;
  dict: SettingsDict;
  flowGatewayInitial: FlowChileAdminRowSafe;
  mercadoPagoGatewayInitial: MercadoPagoAdminRowSafe[];
}

export function FinanceSettingsPanel({
  currentCurrency,
  locale,
  dict,
  flowGatewayInitial,
  mercadoPagoGatewayInitial,
}: FinanceSettingsPanelProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState(currentCurrency);
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  const currencyValid = ISO_4217_CURRENCY_RE.test(normalizeBillingCurrencyInput(currency));
  const hasChanges =
    normalizeBillingCurrencyInput(currency) !== normalizeBillingCurrencyInput(currentCurrency);

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
          <BillingCurrencySelectField
            id="billing-currency"
            value={currency}
            onChange={(next) => {
              setCurrency(next);
              setSaveResult(null);
            }}
            label={dict.currencyLabel}
            otherOptionLabel={dict.currencyOther}
            otherInputAriaLabel={dict.currencyOtherAria}
            disabled={isPending}
          />

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

      <FinanceFlowGatewayCard
        key={`flow-gw-${flowGatewayInitial.environment}-${flowGatewayInitial.enabled}-${flowGatewayInitial.hasCredentials}`}
        locale={locale}
        initial={flowGatewayInitial}
        dict={dict}
      />

      {mercadoPagoGatewayInitial.map((row) => (
        <FinanceMercadoPagoGatewayCard
          key={`mp-gw-${row.countryCode}-${row.environment}-${row.enabled}-${row.hasCredentials}`}
          locale={locale}
          initial={row}
          dict={dict}
        />
      ))}
    </section>
  );
}
