"use server";

import { revalidatePath } from "next/cache";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { billingUploadActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { getFinancialBillingContext } from "@/lib/billing/getFinancialBillingContext";
import { extFromMime } from "@/lib/billing/extFromMime";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 4 * 1024 * 1024;

export async function uploadBillingReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await billingUploadActionDict(formData);
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!invoiceId) return { ok: false, message: pe.invalidForm };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: pe.invalidAmount };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: pe.receiptRequired };
  }
  if (file.size > MAX_BYTES) return { ok: false, message: pe.fileTooLarge };

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return { ok: false, message: pe.mimeInvalid };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (pErr || !profile?.role) return { ok: false, message: pe.profileLoadFailed };

  const role = profile.role as string;
  if (role !== "parent" && role !== "student") {
    return { ok: false, message: pe.forbidden };
  }

  const { data: inv, error: invErr } = await supabase
    .from("billing_invoices")
    .select("id, student_id, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (invErr || !inv) return { ok: false, message: pe.invoiceNotFound };

  const invRow = inv as { id: string; student_id: string; status: string };
  if (!["pending", "overdue"].includes(invRow.status)) {
    return { ok: false, message: pe.invoiceNotActionable };
  }

  const { managesSelf } = await getFinancialBillingContext(
    supabase,
    invRow.student_id,
  );

  if (role === "student") {
    if (user.id !== invRow.student_id || !managesSelf) {
      return { ok: false, message: pe.forbidden };
    }
  } else {
    if (managesSelf) return { ok: false, message: pe.forbidden };
    const { data: link } = await supabase
      .from("tutor_student_rel")
      .select("student_id")
      .eq("tutor_id", user.id)
      .eq("student_id", invRow.student_id)
      .maybeSingle();
    if (!link) return { ok: false, message: pe.studentNotLinked };
  }

  const { count, error: cErr } = await supabase
    .from("billing_receipts")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId)
    .eq("status", "pending_approval");
  if (cErr) return { ok: false, message: pe.uploadFailed };
  if (count && count > 0) return { ok: false, message: pe.pendingReceiptExists };

  const receiptId = crypto.randomUUID();
  const ext = extFromMime(mime);
  const path = `${user.id}/${invoiceId}/${receiptId}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });
  if (upErr) return { ok: false, message: pe.uploadFailed };

  const { error: insErr } = await supabase.from("billing_receipts").insert({
    id: receiptId,
    invoice_id: invoiceId,
    uploaded_by: user.id,
    receipt_storage_path: path,
    amount_paid: amount,
    status: "pending_approval",
  });
  if (insErr) {
    await supabase.storage.from("payment-receipts").remove([path]);
    return { ok: false, message: pe.uploadFailed };
  }

  const { error: invUp } = await supabase
    .from("billing_invoices")
    .update({ status: "verifying" })
    .eq("id", invoiceId)
    .in("status", ["pending", "overdue"]);
  if (invUp) return { ok: false, message: pe.uploadFailed };

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.billingInvoiceReceiptSubmitted,
    metadata: {
      invoice_id: invoiceId,
      actor_role: role,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
    },
  });

  const loc = localeFromFormData(formData);
  revalidatePath(`/${loc}/dashboard/parent/billing`);
  revalidatePath(`/${loc}/dashboard/student/billing`);
  revalidatePath(`/${loc}/dashboard/admin/finance/receipts`);
  return { ok: true };
}
