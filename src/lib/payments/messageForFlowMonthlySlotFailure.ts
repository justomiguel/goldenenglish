import type { Dictionary } from "@/types/i18n";
import type { StudentPaymentSlotFailureReason } from "@/lib/billing/resolveStudentPaymentSlot";

/** User-facing message when Flow checkout cannot open because the payment row could not be resolved. */
export function messageForFlowMonthlySlotFailure(
  pe: Dictionary["actionErrors"]["payment"],
  slotReason: StudentPaymentSlotFailureReason | undefined,
): string {
  if (slotReason === "upload_failed") return pe.paymentSlotSaveFailed;
  if (slotReason === "already_processed") return pe.alreadyProcessed;
  if (slotReason === "month_exempt") return pe.monthExempt;
  if (slotReason === "forbidden") return pe.forbidden;
  return pe.slotNotFound;
}
