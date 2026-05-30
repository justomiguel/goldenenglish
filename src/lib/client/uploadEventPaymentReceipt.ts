export interface UploadEventPaymentReceiptInput {
  slug: string;
  paymentId: string;
  email: string;
  dniOrPassport: string;
  file: File;
}

export type UploadEventPaymentReceiptResult =
  | { ok: true }
  | { ok: false; code: string };

export async function uploadEventPaymentReceipt(
  input: UploadEventPaymentReceiptInput,
): Promise<UploadEventPaymentReceiptResult> {
  const form = new FormData();
  form.set("paymentId", input.paymentId);
  form.set("email", input.email);
  form.set("dniOrPassport", input.dniOrPassport);
  form.set("receipt", input.file);

  const response = await fetch(
    `/api/events/${encodeURIComponent(input.slug)}/payment-receipt`,
    { method: "POST", body: form },
  );

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; code?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    return { ok: false, code: payload?.code ?? "upload_failed" };
  }

  return { ok: true };
}
