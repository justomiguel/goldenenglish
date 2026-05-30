const MAX_BANK_TRANSFER_INSTRUCTIONS_LENGTH = 4000;

/** Plain-text bank transfer details for public registration (no HTML). */
export function sanitizeEventBankTransferInstructions(input: string | null | undefined): string | null {
  if (input == null) return null;
  const normalized = input
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!normalized) return null;
  return normalized.slice(0, MAX_BANK_TRANSFER_INSTRUCTIONS_LENGTH);
}

export const EVENT_BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH = MAX_BANK_TRANSFER_INSTRUCTIONS_LENGTH;
