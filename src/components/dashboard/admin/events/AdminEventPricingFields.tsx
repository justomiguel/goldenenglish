"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";
import { AdminEventPricingGroup } from "@/components/dashboard/admin/events/AdminEventPricingGroup";
import { AdminEventResidencyPriceFields } from "@/components/dashboard/admin/events/AdminEventResidencyPriceFields";
import {
  AdminEventDualTransferFields,
  type AdminEventDualTransferLabels,
} from "@/components/dashboard/admin/events/AdminEventDualTransferFields";
import {
  AdminEventMultiTicketFields,
  type AdminEventMultiTicketConfig,
  type AdminEventMultiTicketLabels,
} from "@/components/dashboard/admin/events/AdminEventMultiTicketFields";
import type { EventBankTransferSourcesConfig } from "@/lib/events/eventBankTransferSources";

interface AdminEventPricingFieldsProps {
  priceLocal: string;
  priceNonLocal: string;
  currency: string;
  bankTransferInstructions: string;
  disabled?: boolean;
  labels: {
    priceLocalLabel: string;
    priceNonLocalLabel: string;
    priceHint: string;
    currencyLabel: string;
    currencyGatewayWarning: string;
    bankTransferInstructionsLabel: string;
    bankTransferInstructionsHint: string;
    allowFamilyDiscountLabel?: string;
    allowMinorTicketsLabel?: string;
    minorTicketPriceLabel?: string;
    minorTicketPriceHint?: string;
    groupPriceTitle?: string;
    groupPriceLead?: string;
    groupTicketsTitle?: string;
    groupTicketsLead?: string;
    groupTransferTitle?: string;
    groupTransferLead?: string;
  };
  onPriceLocalChange: (value: string) => void;
  onPriceNonLocalChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onBankTransferInstructionsChange: (value: string) => void;
  allowFamilyDiscount?: boolean;
  onAllowFamilyDiscountChange?: (checked: boolean) => void;
  allowMinorTickets?: boolean;
  onAllowMinorTicketsChange?: (checked: boolean) => void;
  minorTicketPrice?: string;
  onMinorTicketPriceChange?: (value: string) => void;
  multiTicketConfig?: AdminEventMultiTicketConfig;
  multiTicketLabels?: AdminEventMultiTicketLabels;
  onMultiTicketConfigChange?: (next: AdminEventMultiTicketConfig) => void;
  dualConfig?: EventBankTransferSourcesConfig;
  dualLabels?: AdminEventDualTransferLabels;
  globalInstructions?: string | null;
  onDualConfigChange?: (next: EventBankTransferSourcesConfig) => void;
}

export function AdminEventPricingFields({
  priceLocal,
  priceNonLocal,
  currency,
  bankTransferInstructions,
  disabled,
  labels,
  onPriceLocalChange,
  onPriceNonLocalChange,
  onCurrencyChange,
  onBankTransferInstructionsChange,
  allowFamilyDiscount,
  onAllowFamilyDiscountChange,
  allowMinorTickets,
  onAllowMinorTicketsChange,
  minorTicketPrice,
  onMinorTicketPriceChange,
  multiTicketConfig,
  multiTicketLabels,
  onMultiTicketConfigChange,
  dualConfig,
  dualLabels,
  globalInstructions = null,
  onDualConfigChange,
}: AdminEventPricingFieldsProps) {
  const globalText = globalInstructions?.trim() ?? "";
  const hasGlobal = globalText.length > 0;
  const [useGlobalSingle, setUseGlobalSingle] = useState(
    () =>
      hasGlobal &&
      bankTransferInstructions.trim().length === 0 &&
      !Boolean(dualConfig?.enabled),
  );
  const effectiveUseGlobal = hasGlobal && useGlobalSingle && !Boolean(dualConfig?.enabled);
  const isMultiAccountEnabled = Boolean(dualConfig?.enabled);

  function selectGlobalAccount() {
    setUseGlobalSingle(true);
    onBankTransferInstructionsChange("");
    if (dualConfig && onDualConfigChange && dualConfig.enabled) {
      onDualConfigChange({ ...dualConfig, enabled: false });
    }
  }

  return (
    <div className="space-y-4">
      <AdminEventPricingGroup title={labels.groupPriceTitle} lead={labels.groupPriceLead}>
        <AdminEventResidencyPriceFields
          priceLocal={priceLocal}
          priceNonLocal={priceNonLocal}
          currency={currency}
          disabled={disabled}
          labels={labels}
          onPriceLocalChange={onPriceLocalChange}
          onPriceNonLocalChange={onPriceNonLocalChange}
          onCurrencyChange={onCurrencyChange}
          allowFamilyDiscount={allowFamilyDiscount}
          onAllowFamilyDiscountChange={onAllowFamilyDiscountChange}
          allowMinorTickets={allowMinorTickets}
          onAllowMinorTicketsChange={onAllowMinorTicketsChange}
          minorTicketPrice={minorTicketPrice}
          onMinorTicketPriceChange={onMinorTicketPriceChange}
        />
      </AdminEventPricingGroup>

      {multiTicketConfig && multiTicketLabels && onMultiTicketConfigChange ? (
        <AdminEventPricingGroup title={labels.groupTicketsTitle} lead={labels.groupTicketsLead}>
          <AdminEventMultiTicketFields
            config={multiTicketConfig}
            disabled={disabled}
            labels={multiTicketLabels}
            onChange={onMultiTicketConfigChange}
          />
        </AdminEventPricingGroup>
      ) : null}

      <AdminEventPricingGroup title={labels.groupTransferTitle} lead={labels.groupTransferLead}>
      <div className="space-y-3">
        <Label htmlFor="event-bank-transfer-instructions">
          {labels.bankTransferInstructionsLabel}
        </Label>
        {hasGlobal ? (
          <div className="flex flex-wrap items-center gap-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-2">
            <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={effectiveUseGlobal}
                disabled={disabled}
                onChange={(e) => (e.target.checked ? selectGlobalAccount() : setUseGlobalSingle(false))}
              />
              <span>{dualLabels?.useGlobalSingle ?? "Usar la cuenta global para el evento"}</span>
            </label>
            <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={!effectiveUseGlobal}
                disabled={disabled}
                onChange={(e) => (e.target.checked ? setUseGlobalSingle(false) : selectGlobalAccount())}
              />
              <span>{dualLabels?.useOtherAccounts ?? "Usar otras cuentas"}</span>
            </label>
          </div>
        ) : null}

        {effectiveUseGlobal ? (
          <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-3">
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)]">
              {dualLabels?.globalPreviewLabel ?? labels.bankTransferInstructionsLabel}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-foreground)]">{globalText}</p>
            {dualLabels?.useGlobalSingleActiveHint ? (
              <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                {dualLabels.useGlobalSingleActiveHint}
              </p>
            ) : null}
          </div>
        ) : !isMultiAccountEnabled ? (
          <div>
            {hasGlobal && dualLabels?.customSingleLabel ? (
              <Label htmlFor="event-bank-transfer-instructions" className="mb-1 block">
                {dualLabels.customSingleLabel}
              </Label>
            ) : null}
            <textarea
              id="event-bank-transfer-instructions"
              value={bankTransferInstructions}
              onChange={(e) => onBankTransferInstructionsChange(e.target.value)}
              disabled={disabled}
              rows={5}
              className="mt-1 min-h-[120px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            />
            {!hasGlobal ? (
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {labels.bankTransferInstructionsHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {dualConfig && dualLabels && onDualConfigChange ? (
        <AdminEventDualTransferFields
          config={dualConfig}
          globalInstructions={globalInstructions}
          disabled={disabled || effectiveUseGlobal}
          labels={dualLabels}
          onChange={onDualConfigChange}
        />
      ) : null}
      </AdminEventPricingGroup>
    </div>
  );
}
