"use client";

import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterPaymentOptionClass,
  publicEventRegisterSectionClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterPaymentPickerProps {
  methods: EventRegistrationPaymentMethod[];
  value: EventRegistrationPaymentMethod;
  onChange: (next: EventRegistrationPaymentMethod) => void;
  surfaceVariant?: PublicEventSurfaceVariant;
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
  surfaceVariant = "default",
  labels,
}: EventRegisterPaymentPickerProps) {
  if (methods.length === 0) return null;
  const typography = publicEventRegisterTypography(surfaceVariant);

  const showSelector = methods.length > 1;
  const active = showSelector ? value : methods[0]!;

  return (
    <section className={publicEventRegisterSectionClass(surfaceVariant)}>
      <fieldset className="min-w-0 border-0 p-0">
        <legend className={`${typography.sectionTitle} px-0`}>{labels.title}</legend>
        {showSelector ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map((method) => (
              <label
                key={method}
                className={publicEventRegisterPaymentOptionClass(surfaceVariant)}
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
          <p className={`mt-2 ${typography.body}`}>{labelFor(active, labels)}</p>
        )}
      </fieldset>
    </section>
  );
}
