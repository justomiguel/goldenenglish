"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { updateEventAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { AdminEventPricingFields } from "@/components/dashboard/admin/events/AdminEventPricingFields";

interface AdminEventSummaryPricingFormProps {
  locale: string;
  eventId: string;
  initial: {
    title: string;
    description: string;
    eventDate: string;
    location: string;
    capacity: number;
    priceLocal: number | null;
    priceNonLocal: number | null;
    currency: string;
    bankTransferInstructions: string | null;
  };
  labels: {
    priceLocalLabel: string;
    priceNonLocalLabel: string;
    priceHint: string;
    currencyLabel: string;
    currencyGatewayWarning: string;
    bankTransferInstructionsLabel: string;
    bankTransferInstructionsHint: string;
    save: string;
    savedOk: string;
    errorSave: string;
  };
}

export function AdminEventSummaryPricingForm({
  locale,
  eventId,
  initial,
  labels,
}: AdminEventSummaryPricingFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [priceLocal, setPriceLocal] = useState(
    initial.priceLocal != null ? String(initial.priceLocal) : "",
  );
  const [priceNonLocal, setPriceNonLocal] = useState(
    initial.priceNonLocal != null ? String(initial.priceNonLocal) : "",
  );
  const [currency, setCurrency] = useState(initial.currency);
  const [bankTransferInstructions, setBankTransferInstructions] = useState(
    initial.bankTransferInstructions ?? "",
  );

  function parsePrice(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const value = Number.parseFloat(trimmed);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateEventAction({
        locale,
        eventId,
        title: initial.title,
        description: initial.description,
        eventDate: initial.eventDate,
        location: initial.location,
        capacity: initial.capacity,
        priceLocal: parsePrice(priceLocal),
        priceNonLocal: parsePrice(priceNonLocal),
        currency: currency.trim() || "CLP",
        bankTransferInstructions: bankTransferInstructions.trim() || null,
      });
      if (!result.ok) {
        setMessage(labels.errorSave);
        return;
      }
      setMessage(labels.savedOk);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <AdminEventPricingFields
        priceLocal={priceLocal}
        priceNonLocal={priceNonLocal}
        currency={currency}
        bankTransferInstructions={bankTransferInstructions}
        disabled={pending}
        labels={{
          priceLocalLabel: labels.priceLocalLabel,
          priceNonLocalLabel: labels.priceNonLocalLabel,
          priceHint: labels.priceHint,
          currencyLabel: labels.currencyLabel,
          currencyGatewayWarning: labels.currencyGatewayWarning,
          bankTransferInstructionsLabel: labels.bankTransferInstructionsLabel,
          bankTransferInstructionsHint: labels.bankTransferInstructionsHint,
        }}
        onPriceLocalChange={setPriceLocal}
        onPriceNonLocalChange={setPriceNonLocal}
        onCurrencyChange={setCurrency}
        onBankTransferInstructionsChange={setBankTransferInstructions}
      />
      <Button type="submit" isLoading={pending} disabled={pending}>
        {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.save}
      </Button>
      {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </form>
  );
}
