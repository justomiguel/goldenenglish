"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Buffer } from "node:buffer";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { startRegistrationEnrollmentGatewayCore } from "@/lib/register/startRegistrationEnrollmentGatewayCore";
import { switchRegistrationPaySectionCore } from "@/lib/register/switchRegistrationPaySectionCore";
import { uploadRegistrationEnrollmentReceiptCore } from "@/lib/register/uploadRegistrationEnrollmentReceiptCore";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";

export type MatriculaPayActionResult = { ok: true } | { ok: false; code: string };

export async function startRegistrationEnrollmentFlowAction(
  locale: string,
  token: string,
): Promise<MatriculaPayActionResult> {
  return startGateway(locale, token, "flow");
}

export async function startRegistrationEnrollmentMercadoPagoAction(
  locale: string,
  token: string,
): Promise<MatriculaPayActionResult> {
  return startGateway(locale, token, "mercadopago");
}

async function startGateway(
  locale: string,
  token: string,
  method: "flow" | "mercadopago",
): Promise<MatriculaPayActionResult> {
  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { ok: false, code: "method_unavailable" };
  }
  const result = await startRegistrationEnrollmentGatewayCore({
    admin: createAdminClient(),
    encryptionKey32: rawKey,
    payToken: token,
    method,
    locale,
  });
  if (result.ok) redirect(result.redirectUrl);
  return result;
}

export async function uploadRegistrationEnrollmentReceiptAction(
  formData: FormData,
): Promise<MatriculaPayActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es").trim() || "es";
  const sectionLabel = String(formData.get("sectionLabel") ?? "");
  const file = formData.get("receipt");
  if (!(file instanceof File)) return { ok: false, code: "invalid_file" };
  const result = await uploadRegistrationEnrollmentReceiptCore({
    admin: createAdminClient(),
    payToken: token,
    fileName: file.name,
    fileBytes: Buffer.from(await file.arrayBuffer()),
    fileMime: file.type,
    locale,
    sectionLabel,
  });
  if (result.ok) revalidatePath(`/${locale}/matricula/${token}`);
  return result;
}

export async function switchRegistrationPaySectionAction(
  locale: string,
  token: string,
  sectionId: string,
): Promise<MatriculaPayActionResult> {
  const admin = createAdminClient();
  const result = await switchRegistrationPaySectionCore({
    admin,
    payToken: token,
    sectionId,
    nowIso: new Date().toISOString(),
  });
  if (!result.ok) return result;
  if (result.needsAccept) {
    const accepted = await acceptRegistrationLead({
      admin,
      enrollClient: admin,
      locale,
      dict: await getDictionary(locale),
      registrationId: result.registrationId,
      paidCapture: true,
      enrollServiceRole: true,
    });
    if (!accepted.ok) return { ok: false, code: "accept_failed" };
  }
  revalidatePath(`/${locale}/matricula/${token}`);
  return { ok: true };
}
