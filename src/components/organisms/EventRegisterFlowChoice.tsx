"use client";

import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";

interface EventRegisterFlowChoiceProps {
  label: string;
  flows: Array<{ id: string; name: string; price?: number | null }>;
  value: string | null;
  onChange: (flowId: string) => void;
  disabled?: boolean;
  showPrices?: boolean;
  currency?: string;
  locale?: string;
  freeLabel?: string;
}

export function EventRegisterFlowChoice({
  label,
  flows,
  value,
  onChange,
  disabled,
  showPrices = false,
  currency = "CLP",
  locale = "es",
  freeLabel = "",
}: EventRegisterFlowChoiceProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-[var(--color-foreground)]">{label}</legend>
      <div className="space-y-2">
        {flows.map((flow) => (
          <label
            key={flow.id}
            className="flex min-h-[44px] items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="registration-flow"
                value={flow.id}
                required
                checked={value === flow.id}
                onChange={() => onChange(flow.id)}
              />
              {flow.name}
            </span>
            {showPrices ? (
              <span className="text-base font-semibold tabular-nums text-[var(--color-primary)]">
                {formatEventFlowPriceLabel({
                  price: flow.price ?? null,
                  currency,
                  locale,
                  freeLabel,
                })}
              </span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
