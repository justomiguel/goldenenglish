import { sanitizeBankTransferInstructions } from "@/lib/billing/sanitizeBankTransferInstructions";

/**
 * Event-specific instructions win when set; otherwise fall back to institute-wide Finanzas setting.
 */
export function resolveBankTransferInstructions(
  eventInstructions: string | null | undefined,
  globalInstructions: string | null | undefined,
): string | null {
  const event = sanitizeBankTransferInstructions(eventInstructions);
  if (event) return event;
  return sanitizeBankTransferInstructions(globalInstructions);
}
