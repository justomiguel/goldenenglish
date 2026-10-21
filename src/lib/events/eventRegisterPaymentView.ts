import {
  eventRequiresPayment,
  resolveEventPriceForResidency,
  type EventPriceSource,
} from "@/lib/events/resolveEventPriceTier";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";

export function eventRegisterPaymentView(input: {
  priceByFlow: boolean;
  flowPrice: number | null;
  priceSource: EventPriceSource;
  isLocalResident: boolean;
  payableAmount: number | null;
  paymentMethods: EventRegistrationPaymentMethod[];
  selectedPaymentMethod: EventRegistrationPaymentMethod;
  bankTransferInstructions: string | null;
}): {
  selectedPrice: number | null;
  showPaymentPicker: boolean;
  requiresTransferReceipt: boolean;
  showTransferInstructions: boolean;
} {
  const computed = input.priceByFlow
    ? input.flowPrice
    : resolveEventPriceForResidency(input.priceSource, input.isLocalResident);
  const selectedPrice = input.payableAmount ?? computed;
  const requiresPayment =
    input.payableAmount != null
      ? input.payableAmount > 0
      : input.priceByFlow
        ? (input.flowPrice ?? 0) > 0
        : eventRequiresPayment(input.priceSource, input.isLocalResident);
  const showPaymentPicker = requiresPayment && input.paymentMethods.length > 0;
  const transfer = input.selectedPaymentMethod === "transfer" && input.paymentMethods.includes("transfer");
  return {
    selectedPrice,
    showPaymentPicker,
    requiresTransferReceipt: showPaymentPicker && transfer,
    showTransferInstructions: showPaymentPicker && transfer && Boolean(input.bankTransferInstructions?.trim()),
  };
}
