"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { startTrialConvertAction } from "@/app/[locale]/unirse/trialConvertActions";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

export type TrialConvertSeatView = {
  sectionId: string;
  label: string;
  status: string;
  payable: boolean;
};

export function TrialConvertScreen({
  locale,
  token,
  studentName,
  seats,
  quoteTotal,
  quoteCurrency,
  quoteKind,
  methods,
  labels,
}: {
  locale: string;
  token: string;
  studentName: string;
  seats: TrialConvertSeatView[];
  quoteTotal: number;
  quoteCurrency: string;
  quoteKind: "enrollment" | "first_month" | "enrollment_and_month";
  methods: RegistrationPublicPayMethod[];
  labels: {
    title: string;
    lead: string;
    expiredTitle: string;
    expiredLead: string;
    pick: string;
    amount: string;
    enrollmentKind: string;
    monthKind: string;
    bothKind: string;
    joinFree: string;
    flow: string;
    mercadoPago: string;
    error: string;
    nonePayable: string;
  };
}) {
  const payable = seats.filter((seat) => seat.payable);
  const [selected, setSelected] = useState<string[]>(payable.map((seat) => seat.sectionId));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const amount =
    quoteTotal > 0 ? formatMoneyLabel(quoteTotal, quoteCurrency, locale) : null;

  function run(method: "flow" | "mercadopago" | "free") {
    setError(null);
    start(async () => {
      const result = await startTrialConvertAction({
        locale,
        token,
        sectionIds: selected,
        method,
      });
      if (!result.ok) setError(labels.error);
    });
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">{labels.title}</h1>
      <p className="mt-3">{studentName}</p>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <fieldset className="mt-6 space-y-2">
        <legend className="text-sm font-medium">{labels.pick}</legend>
        {seats.map((seat) => (
          <label key={seat.sectionId} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              disabled={!seat.payable}
              checked={selected.includes(seat.sectionId)}
              onChange={(event) => {
                setSelected((prev) =>
                  event.target.checked
                    ? [...prev, seat.sectionId]
                    : prev.filter((id) => id !== seat.sectionId),
                );
              }}
            />
            <span>
              {seat.label}
              {!seat.payable ? ` — ${labels.nonePayable}` : ""}
            </span>
          </label>
        ))}
      </fieldset>
      {amount ? (
        <p className="mt-6 text-lg font-medium">
          {labels.amount}: {amount} ({
            quoteKind === "enrollment_and_month"
              ? labels.bothKind
              : quoteKind === "enrollment"
                ? labels.enrollmentKind
                : labels.monthKind
          })
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {quoteTotal <= 0 ? (
          <Button type="button" disabled={pending || selected.length === 0} onClick={() => run("free")}>
            {labels.joinFree}
          </Button>
        ) : (
          <>
            {methods.includes("flow") ? (
              <Button type="button" disabled={pending || selected.length === 0} onClick={() => run("flow")}>
                {labels.flow}
              </Button>
            ) : null}
            {methods.includes("mercadopago") ? (
              <Button
                type="button"
                disabled={pending || selected.length === 0}
                onClick={() => run("mercadopago")}
              >
                {labels.mercadoPago}
              </Button>
            ) : null}
          </>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}

export function TrialConvertExpiredScreen({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">{lead}</p>
    </section>
  );
}
