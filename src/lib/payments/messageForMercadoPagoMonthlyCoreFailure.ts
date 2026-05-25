import type { StartMercadoPagoMonthlyPaymentCoreResult } from "@/lib/billing/startMercadoPagoMonthlyPaymentCore";
import type { Dictionary } from "@/types/i18n";
import { messageForFlowMonthlySlotFailure } from "@/lib/payments/messageForFlowMonthlySlotFailure";

type MonthlyDict = Dictionary["dashboard"]["student"]["monthly"];
type PaymentPe = Dictionary["actionErrors"]["payment"];

export function messageForMercadoPagoMonthlyCoreFailure(
  pe: PaymentPe,
  monthly: MonthlyDict,
  core: Extract<StartMercadoPagoMonthlyPaymentCoreResult, { ok: false }>,
): string {
  if (core.code === "currency_unsupported" || core.code === "no_country") {
    return monthly.mpErrorCurrencyUnsupported;
  }
  if (core.code === "no_public_url") {
    return monthly.flowErrorNoPublicUrl;
  }
  if (core.code === "no_credentials") {
    return monthly.mpErrorUnavailable;
  }
  if (core.code === "mp_error") {
    return monthly.mpErrorProvider;
  }
  if (core.code === "slot") {
    return messageForFlowMonthlySlotFailure(pe, core.slotReason);
  }
  return pe.slotNotFound;
}
