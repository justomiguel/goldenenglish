"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { updateEventAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { AdminEventPricingFields } from "@/components/dashboard/admin/events/AdminEventPricingFields";
import type { AdminEventDualTransferLabels } from "@/components/dashboard/admin/events/AdminEventDualTransferFields";
import type {
  AdminEventMultiTicketConfig,
  AdminEventMultiTicketLabels,
} from "@/components/dashboard/admin/events/AdminEventMultiTicketFields";
import {
  createDefaultEventBankTransferSourcesConfig,
  parseEventBankTransferSourcesConfig,
} from "@/lib/events/eventBankTransferSources";

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
    bankTransferSourcesConfig: unknown;
    globalInstructions: string | null;
    allowFamilyDiscount?: boolean;
    allowMinorTickets?: boolean;
    minorTicketPrice?: number | null;
    allowMultipleTickets?: boolean;
    maxTicketsPerRegistration?: number | null;
    companionRequireDetails?: boolean;
    companionCollectDni?: boolean;
    companionCollectEmail?: boolean;
    companionCollectBirthDate?: boolean;
  };
  labels: {
    priceLocalLabel: string;
    priceNonLocalLabel: string;
    priceHint: string;
    allowFamilyDiscountLabel?: string;
    allowMinorTicketsLabel?: string;
    minorTicketPriceLabel?: string;
    minorTicketPriceHint?: string;
    currencyLabel: string;
    currencyGatewayWarning: string;
    bankTransferInstructionsLabel: string;
    bankTransferInstructionsHint: string;
    groupPriceTitle?: string;
    groupPriceLead?: string;
    groupTicketsTitle?: string;
    groupTicketsLead?: string;
    groupTransferTitle?: string;
    groupTransferLead?: string;
    multiTicket?: AdminEventMultiTicketLabels;
    dualTransfer: AdminEventDualTransferLabels;
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
  const [allowFamilyDiscount, setAllowFamilyDiscount] = useState(
    Boolean(initial.allowFamilyDiscount),
  );
  const [allowMinorTickets, setAllowMinorTickets] = useState(Boolean(initial.allowMinorTickets));
  const [minorTicketPrice, setMinorTicketPrice] = useState(
    initial.minorTicketPrice != null ? String(initial.minorTicketPrice) : "",
  );
  const [multiTicketConfig, setMultiTicketConfig] = useState<AdminEventMultiTicketConfig>({
    allowMultipleTickets: Boolean(initial.allowMultipleTickets),
    maxTicketsPerRegistration: Math.max(2, Number(initial.maxTicketsPerRegistration ?? 4)),
    companionRequireDetails: Boolean(initial.companionRequireDetails),
    companionCollectDni: Boolean(initial.companionCollectDni),
    companionCollectEmail: Boolean(initial.companionCollectEmail),
    companionCollectBirthDate: Boolean(initial.companionCollectBirthDate),
  });
  const [dualConfig, setDualConfig] = useState(
    () =>
      parseEventBankTransferSourcesConfig(initial.bankTransferSourcesConfig) ??
      createDefaultEventBankTransferSourcesConfig(),
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
        bankTransferSourcesConfig: dualConfig,
        allowFamilyDiscount,
        allowMinorTickets,
        minorTicketPrice: allowMinorTickets ? parsePrice(minorTicketPrice) : null,
        allowMultipleTickets: multiTicketConfig.allowMultipleTickets,
        maxTicketsPerRegistration: multiTicketConfig.allowMultipleTickets
          ? multiTicketConfig.maxTicketsPerRegistration
          : null,
        companionRequireDetails: multiTicketConfig.companionRequireDetails,
        companionCollectDni: multiTicketConfig.companionCollectDni,
        companionCollectEmail: multiTicketConfig.companionCollectEmail,
        companionCollectBirthDate: multiTicketConfig.companionCollectBirthDate,
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
          allowFamilyDiscountLabel: labels.allowFamilyDiscountLabel,
          allowMinorTicketsLabel: labels.allowMinorTicketsLabel,
          minorTicketPriceLabel: labels.minorTicketPriceLabel,
          minorTicketPriceHint: labels.minorTicketPriceHint,
          groupPriceTitle: labels.groupPriceTitle,
          groupPriceLead: labels.groupPriceLead,
          groupTicketsTitle: labels.groupTicketsTitle,
          groupTicketsLead: labels.groupTicketsLead,
          groupTransferTitle: labels.groupTransferTitle,
          groupTransferLead: labels.groupTransferLead,
        }}
        onPriceLocalChange={setPriceLocal}
        onPriceNonLocalChange={setPriceNonLocal}
        onCurrencyChange={setCurrency}
        onBankTransferInstructionsChange={setBankTransferInstructions}
        allowFamilyDiscount={allowFamilyDiscount}
        onAllowFamilyDiscountChange={setAllowFamilyDiscount}
        allowMinorTickets={allowMinorTickets}
        onAllowMinorTicketsChange={setAllowMinorTickets}
        minorTicketPrice={minorTicketPrice}
        onMinorTicketPriceChange={setMinorTicketPrice}
        multiTicketConfig={labels.multiTicket ? multiTicketConfig : undefined}
        multiTicketLabels={labels.multiTicket}
        onMultiTicketConfigChange={setMultiTicketConfig}
        dualConfig={dualConfig}
        dualLabels={labels.dualTransfer}
        globalInstructions={initial.globalInstructions}
        onDualConfigChange={setDualConfig}
      />
      <Button type="submit" isLoading={pending} disabled={pending}>
        {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.save}
      </Button>
      {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </form>
  );
}
