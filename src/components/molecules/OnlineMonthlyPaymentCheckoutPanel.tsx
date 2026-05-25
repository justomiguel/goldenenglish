"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

export interface OnlineMonthlyPaymentCheckoutPanelProps {
  labels: MonthlyLabels;
  enabledGateways: PaymentGatewayProvider[];
  busy: boolean;
  onlineBusy: boolean;
  feedbackMessage: string | null;
  onPay: (provider: PaymentGatewayProvider) => void | Promise<void>;
}

export function OnlineMonthlyPaymentCheckoutPanel({
  labels,
  enabledGateways,
  busy,
  onlineBusy,
  feedbackMessage,
  onPay,
}: OnlineMonthlyPaymentCheckoutPanelProps) {
  const [selected, setSelected] = useState<PaymentGatewayProvider>(
    enabledGateways[0] ?? "flow",
  );

  if (enabledGateways.length === 0) return null;

  const showSelector = enabledGateways.length > 1;

  function labelFor(provider: PaymentGatewayProvider): string {
    if (provider === "flow") return labels.gatewayFlow;
    return labels.gatewayMercadoPago;
  }

  function hintFor(provider: PaymentGatewayProvider): string {
    if (provider === "flow") return labels.payWithFlowHint;
    return labels.payWithMercadoPagoHint;
  }

  const active = showSelector ? selected : enabledGateways[0]!;

  return (
    <div className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      {showSelector ? (
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.choosePaymentGateway}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {enabledGateways.map((g) => (
              <label
                key={g}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="payment-gateway"
                  checked={selected === g}
                  onChange={() => setSelected(g)}
                  className="h-4 w-4"
                />
                {labelFor(g)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <p className="text-sm text-[var(--color-muted-foreground)]">{hintFor(active)}</p>
      <Button
        type="button"
        variant="secondary"
        disabled={busy || onlineBusy}
        isLoading={onlineBusy}
        onClick={() => void onPay(active)}
        className="min-h-[44px] w-full sm:w-auto"
      >
        {!onlineBusy ? <Wallet className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {active === "flow" ? labels.payWithFlow : labels.payWithMercadoPago}
      </Button>
      {feedbackMessage ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{feedbackMessage}</p>
      ) : null}
    </div>
  );
}
