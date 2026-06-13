export const BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH = 4000;

/** Plain-text bank transfer details (no HTML). */
export function sanitizeBankTransferInstructions(
  input: string | null | undefined,
): string | null {
  if (input == null) return null;
  const normalized = input
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!normalized) return null;
  return normalized.slice(0, BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH);
}
