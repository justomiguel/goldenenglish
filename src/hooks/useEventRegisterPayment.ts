"use client";

import { useState } from "react";
import { eventRegisterPaymentView } from "@/lib/events/eventRegisterPaymentView";
import { resolveEventRegistrationTotals } from "@/lib/events/resolveEventRegistrationTotals";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";
import type { EventBankTransferSourcesConfig } from "@/lib/events/eventBankTransferSources";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import type { EventCompanionPayload } from "@/lib/events/types";

interface UseEventRegisterPaymentInput {
  paymentMethods: EventRegistrationPaymentMethod[];
  priceByFlow: boolean;
  flowPrice: number | null;
  priceSource: EventPriceSource;
  isLocalResident: boolean;
  payableAmount: number | null;
  appliedCode: EventDiscountApplied | null;
  familyDiscountClaimed: boolean;
  currency: string;
  allowMultipleTickets: boolean;
  allowMinorTickets: boolean;
  minorTicketPrice: number | null;
  bankTransferInstructions: string | null;
  globalTransferInstructions: string | null;
  bankTransferSourcesConfig: EventBankTransferSourcesConfig | null;
}

export function useEventRegisterPayment(input: UseEventRegisterPaymentInput) {
  const [paymentMethod, setPaymentMethod] = useState<EventRegistrationPaymentMethod>(
    () => input.paymentMethods[0] ?? "transfer",
  );
  const selectedPaymentMethod = input.paymentMethods.includes(paymentMethod)
    ? paymentMethod
    : (input.paymentMethods[0] ?? "transfer");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFieldError, setReceiptFieldError] = useState("");
  const [transferOptionId, setTransferOptionId] = useState<string | null>(null);
  const [transferSourceKey, setTransferSourceKey] = useState<string | null>(null);
  const [selectedSeatKeys, setSelectedSeatKeys] = useState<string[]>([]);
  const [ticketQuantity, setTicketQuantityState] = useState<number>(1);
  const [minorTicketCount, setMinorTicketCountState] = useState(0);
  const [companions, setCompanions] = useState<EventCompanionPayload[]>([]);

  const view = eventRegisterPaymentView({
    priceByFlow: input.priceByFlow,
    flowPrice: input.flowPrice,
    priceSource: input.priceSource,
    isLocalResident: input.isLocalResident,
    payableAmount: input.payableAmount,
    paymentMethods: input.paymentMethods,
    selectedPaymentMethod,
    bankTransferInstructions: input.bankTransferInstructions,
    globalTransferInstructions: input.globalTransferInstructions,
    bankTransferSourcesConfig: input.bankTransferSourcesConfig,
  });
  const seats = input.allowMultipleTickets ? ticketQuantity : 1;
  const minorTickets = input.allowMinorTickets ? Math.min(seats, minorTicketCount) : 0;
  const hasDiscount = input.appliedCode != null || input.familyDiscountClaimed;
  const totals = hasDiscount || minorTickets > 0
    ? resolveEventRegistrationTotals({
        unitPrice: view.unitPrice,
        seats,
        minorTickets,
        minorUnitPrice: input.minorTicketPrice,
        currency: input.currency,
        familyDiscountClaimed: input.familyDiscountClaimed && input.appliedCode == null,
        appliedCode: input.appliedCode,
      })
    : null;
  const selectedPrice = totals
    ? totals.finalTotal
    : view.selectedPrice == null
      ? null
      : view.selectedPrice * seats;
  const showPaymentPicker = totals
    ? (totals.finalTotal ?? 0) > 0 && input.paymentMethods.length > 0
    : view.showPaymentPicker;
  const requiresTransferReceipt = totals
    ? showPaymentPicker && selectedPaymentMethod === "transfer" && input.paymentMethods.includes("transfer")
    : view.requiresTransferReceipt;

  function setTicketQuantity(next: number) {
    const quantity = Math.max(1, Math.floor(next));
    setTicketQuantityState(quantity);
    setMinorTicketCountState((current) => Math.min(current, quantity));
  }

  function setMinorTicketCount(next: number) {
    const cap = input.allowMultipleTickets ? ticketQuantity : 1;
    const value = Math.floor(next);
    setMinorTicketCountState(Number.isFinite(value) ? Math.min(cap, Math.max(0, value)) : 0);
  }

  function updateCompanion(index: number, partial: Partial<EventCompanionPayload>) {
    setCompanions((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({ firstName: "", lastName: "" });
      }
      next[index] = { ...next[index]!, ...partial };
      return next;
    });
  }

  return {
    paymentMethod: selectedPaymentMethod,
    setPaymentMethod,
    ...view,
    selectedPrice,
    showPaymentPicker,
    requiresTransferReceipt,
    receiptFile,
    setReceiptFile,
    setReceiptFieldError,
    receiptFieldError,
    transferOptionId,
    setTransferOptionId,
    transferSourceKey,
    setTransferSourceKey,
    selectedSeatKeys,
    setSelectedSeatKeys,
    ticketQuantity,
    setTicketQuantity,
    minorTicketCount: minorTickets,
    setMinorTicketCount,
    companions,
    updateCompanion,
  };
}
