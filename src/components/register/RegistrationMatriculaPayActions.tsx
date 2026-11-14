"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, ArrowRight, Landmark } from "lucide-react";
import {
  claimRegistrationEnrollmentCashAction,
  startRegistrationEnrollmentFlowAction,
  startRegistrationEnrollmentMercadoPagoAction,
  switchRegistrationPaySectionAction,
  uploadRegistrationEnrollmentReceiptAction,
} from "@/app/[locale]/matricula/matriculaPayActions";
import { RegistrationEnrollmentPayChoices } from "@/components/register/RegistrationEnrollmentPayChoices";
import {
  startTrialFeeFlowAction,
  startTrialFeeMercadoPagoAction,
} from "@/app/[locale]/clase-prueba/trialFeePayActions";
import { RegistrationMatriculaPayLeave } from "@/components/register/RegistrationMatriculaPayLeave";
import { explainCodedFailure } from "@/lib/errors/revealFailureCode";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

export type RegistrationMatriculaPayActionLabels = {
  flow: string;
  mercadoPago: string;
  transfer: string;
  transferHint: string;
  uploadButton: string;
  chooseFile?: string;
  pickSection: string;
  error: string;
  failures?: Partial<Record<string, string>>;
  receiptOk: string;
  acceptOffer?: string;
  cash?: string;
  online?: string;
  uploadChoice?: string;
  onlineEmpty?: string;
  cashOk?: string;
};

const btnClass =
  "inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-60";

export function RegistrationMatriculaPayActions({
  locale,
  token,
  sectionLabel,
  methods,
  transferInstructions,
  alternatives,
  showPay,
  showSwitch,
  proposedSectionId,
  labels,
  variant = "enrollment",
  homeHref,
  leavingLabel,
}: {
  locale: string;
  token: string;
  sectionLabel: string;
  methods: RegistrationPublicPayMethod[];
  transferInstructions: string | null;
  alternatives: { id: string; label: string }[];
  showPay: boolean;
  showSwitch: boolean;
  proposedSectionId?: string | null;
  labels: RegistrationMatriculaPayActionLabels;
  variant?: "enrollment" | "trial";
  homeHref?: string;
  leavingLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [error, setError] = useState("");
  const [receiptOk, setReceiptOk] = useState(false);
  const [cashOk, setCashOk] = useState(false);
  const enrollmentChoices = showPay && variant !== "trial" && Boolean(labels.cash);

  function run(action: () => Promise<{ ok: true } | { ok: false; code?: string }>) {
    setError("");
    start(async () => {
      const result = await action();
      if (!result.ok) {
        setError(explainCodedFailure(result.code, labels.failures, labels.error));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {cashOk ? (
        <>
          <p className="text-sm" role="status">
            {labels.cashOk}
          </p>
          {homeHref && leavingLabel ? (
            <RegistrationMatriculaPayLeave href={homeHref} label={leavingLabel} />
          ) : null}
        </>
      ) : null}
      {enrollmentChoices && !cashOk ? (
        <RegistrationEnrollmentPayChoices
          methods={methods}
          transferInstructions={transferInstructions}
          labels={labels}
          pending={pending}
          receiptBusy={receiptBusy}
          receiptOk={receiptOk}
          homeHref={homeHref}
          leavingLabel={leavingLabel}
          onCash={() => {
            setError("");
            start(async () => {
              const result = await claimRegistrationEnrollmentCashAction(locale, token, sectionLabel);
              if (!result.ok) {
                setError(explainCodedFailure(result.code, labels.failures, labels.error));
                return;
              }
              setCashOk(true);
            });
          }}
          onFlow={() =>
            run(() => startRegistrationEnrollmentFlowAction(locale, token))
          }
          onMercadoPago={() =>
            run(() => startRegistrationEnrollmentMercadoPagoAction(locale, token))
          }
          onReceipt={(data) => {
            data.set("token", token);
            data.set("locale", locale);
            data.set("sectionLabel", sectionLabel);
            setReceiptBusy(true);
            setError("");
            start(async () => {
              try {
                const result = await uploadRegistrationEnrollmentReceiptAction(data);
                if (!result.ok) {
                  setError(explainCodedFailure(result.code, labels.failures, labels.error));
                  return;
                }
                setReceiptOk(true);
              } finally {
                setReceiptBusy(false);
              }
            });
          }}
        />
      ) : null}
      {showPay && !enrollmentChoices && methods.includes("flow") ? (
        <button
          type="button"
          className={btnClass}
          disabled={pending}
          onClick={() =>
            run(() =>
              variant === "trial"
                ? startTrialFeeFlowAction(locale, token)
                : startRegistrationEnrollmentFlowAction(locale, token),
            )
          }
        >
          <CreditCard className="h-4 w-4" aria-hidden />
          {labels.flow}
        </button>
      ) : null}
      {showPay && !enrollmentChoices && methods.includes("mercadopago") ? (
        <button
          type="button"
          className={btnClass}
          disabled={pending}
          onClick={() =>
            run(() =>
              variant === "trial"
                ? startTrialFeeMercadoPagoAction(locale, token)
                : startRegistrationEnrollmentMercadoPagoAction(locale, token),
            )
          }
        >
          <Landmark className="h-4 w-4" aria-hidden />
          {labels.mercadoPago}
        </button>
      ) : null}
      {showSwitch && proposedSectionId && labels.acceptOffer ? (
        <button
          type="button"
          className={btnClass}
          disabled={pending}
          onClick={() =>
            run(() => switchRegistrationPaySectionAction(locale, token, proposedSectionId))
          }
        >
          <Check className="h-4 w-4" aria-hidden />
          {labels.acceptOffer}
        </button>
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
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  {alt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
