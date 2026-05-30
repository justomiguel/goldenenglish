/** Public event bank-transfer receipt uploads (≤ storage bucket limit in migration 139). */
export const EVENT_TRANSFER_RECEIPT_MAX_BYTES = 15 * 1024 * 1024;

export const EVENT_TRANSFER_RECEIPT_ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf";

export function eventTransferReceiptMaxSizeMb(): number {
  return Math.floor(EVENT_TRANSFER_RECEIPT_MAX_BYTES / (1024 * 1024));
}

export function fillEventTransferReceiptMaxMbTemplate(template: string): string {
  return template.replaceAll("{max}", String(eventTransferReceiptMaxSizeMb()));
}

export function normalizeEventRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeEventRegistrationDni(dniOrPassport: string): string {
  return dniOrPassport.trim().toLowerCase();
}

export function isAllowedEventTransferReceiptMime(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  return normalized.startsWith("image/") || normalized === "application/pdf";
}

export type ValidateEventTransferReceiptFileResult =
  | { ok: true; mime: string }
  | { ok: false; code: "missing" | "too_large" | "invalid_type" };

export function validateEventTransferReceiptFile(
  file: Pick<File, "size" | "type"> | null | undefined,
): ValidateEventTransferReceiptFileResult {
  if (!file || file.size <= 0) {
    return { ok: false, code: "missing" };
  }
  if (file.size > EVENT_TRANSFER_RECEIPT_MAX_BYTES) {
    return { ok: false, code: "too_large" };
  }
  const mime = file.type?.trim() || "application/octet-stream";
  if (!isAllowedEventTransferReceiptMime(mime)) {
    return { ok: false, code: "invalid_type" };
  }
  return { ok: true, mime };
}
