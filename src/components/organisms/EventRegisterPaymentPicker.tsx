"use client";

import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";

interface EventRegisterPaymentPickerProps {
  methods: EventRegistrationPaymentMethod[];
  value: EventRegistrationPaymentMethod;
  onChange: (next: EventRegistrationPaymentMethod) => void;
  labels: {
    title: string;
    flow: string;
    mercadopago: string;
    transfer: string;
  };
}

function labelFor(method: EventRegistrationPaymentMethod, labels: EventRegisterPaymentPickerProps["labels"]): string {
  if (method === "flow") return labels.flow;
  if (method === "mercadopago") return labels.mercadopago;
  return labels.transfer;
}

export function EventRegisterPaymentPicker({
  methods,
  value,
  onChange,
  labels,
}: EventRegisterPaymentPickerProps) {
  if (methods.length === 0) return null;

  const showSelector = methods.length > 1;
  const active = showSelector ? value : methods[0]!;

  return (
    <section className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</legend>
        {showSelector ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map((method) => (
              <label
                key={method}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="event-payment-method"
                  className="h-4 w-4"
                  checked={value === method}
                  onChange={() => onChange(method)}
                />
                {labelFor(method, labels)}
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-foreground)]">{labelFor(active, labels)}</p>
        )}
      </fieldset>
    </section>
  );
}
