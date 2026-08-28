"use client";

import { useState, useTransition } from "react";
import {
  startRegistrationEnrollmentFlowAction,
  startRegistrationEnrollmentMercadoPagoAction,
  switchRegistrationPaySectionAction,
  uploadRegistrationEnrollmentReceiptAction,
} from "@/app/[locale]/matricula/matriculaPayActions";
import { EVENT_TRANSFER_RECEIPT_ACCEPT } from "@/lib/events/eventTransferReceiptLimits";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

export type RegistrationMatriculaPayActionLabels = {
  flow: string;
  mercadoPago: string;
  transfer: string;
  transferHint: string;
  uploadButton: string;
  pickSection: string;
  error: string;
  receiptOk: string;
};

const btnClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-60";

export function RegistrationMatriculaPayActions({
  locale,
  token,
  sectionLabel,
  methods,
  transferInstructions,
  alternatives,
  showPay,
  showSwitch,
  labels,
}: {
  locale: string;
  token: string;
  sectionLabel: string;
  methods: RegistrationPublicPayMethod[];
  transferInstructions: string | null;
  alternatives: { id: string; label: string }[];
  showPay: boolean;
  showSwitch: boolean;
  labels: RegistrationMatriculaPayActionLabels;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [receiptOk, setReceiptOk] = useState(false);

  function run(action: () => Promise<{ ok: boolean }>) {
    setError("");
    start(async () => {
      const result = await action();
      if (!result.ok) setError(labels.error);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {showPay && methods.includes("flow") ? (
        <button
          type="button"
          className={btnClass}
          disabled={pending}
          onClick={() => run(() => startRegistrationEnrollmentFlowAction(locale, token))}
        >
          {labels.flow}
        </button>
      ) : null}
      {showPay && methods.includes("mercadopago") ? (
        <button
          type="button"
          className={`${btnClass} ml-2`}
          disabled={pending}
          onClick={() =>
            run(() => startRegistrationEnrollmentMercadoPagoAction(locale, token))
          }
        >
          {labels.mercadoPago}
        </button>
      ) : null}
      {showPay && methods.includes("transfer") && transferInstructions ? (
        <form
          className="space-y-3 rounded-lg border border-[var(--color-border)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            data.set("token", token);
            data.set("locale", locale);
            data.set("sectionLabel", sectionLabel);
            run(async () => {
              const result = await uploadRegistrationEnrollmentReceiptAction(data);
              if (result.ok) setReceiptOk(true);
              return result;
            });
          }}
        >
          <p className="font-medium">{labels.transfer}</p>
          <p className="whitespace-pre-wrap text-sm text-[var(--color-muted-foreground)]">
            {transferInstructions}
          </p>
          <p className="text-sm">{labels.transferHint}</p>
          <input
            type="file"
            name="receipt"
            required
            accept={EVENT_TRANSFER_RECEIPT_ACCEPT}
            className="block w-full text-sm"
          />
          <button type="submit" className={btnClass} disabled={pending}>
            {labels.uploadButton}
          </button>
          {receiptOk ? <p className="text-sm">{labels.receiptOk}</p> : null}
        </form>
      ) : null}
      {showSwitch && alternatives.length > 0 ? (
        <div className="space-y-2">
          <p className="font-medium">{labels.pickSection}</p>
          <ul className="space-y-2">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <button
                  type="button"
                  className={btnClass}
                  disabled={pending}
                  onClick={() =>
                    run(() => switchRegistrationPaySectionAction(locale, token, alt.id))
                  }
                >
                  {alt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
