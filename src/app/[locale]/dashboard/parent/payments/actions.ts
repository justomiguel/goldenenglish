"use server";

import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { createClient } from "@/lib/supabase/server";
import { paymentActionDict } from "@/lib/i18n/actionErrors";

const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function submitParentPaymentReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const studentId = String(formData.get("studentId") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!studentId || !Number.isFinite(month) || !Number.isFinite(year)) {
    return { ok: false, message: pe.invalidForm };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: pe.invalidAmount };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: pe.receiptRequired };
  }
  if (file.size > MAX_BYTES) return { ok: false, message: pe.fileTooLarge };

  const mime = file.type || "application/octet-stream";
  if (
    !mime.startsWith("image/") &&
    mime !== "application/pdf"
  ) {
    return { ok: false, message: pe.mimeInvalid };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") return { ok: false, message: pe.forbidden };

  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return { ok: false, message: pe.studentNotLinked };

  const { data: pay, error: payErr } = await supabase
    .from("payments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (payErr || !pay) return { ok: false, message: pe.slotNotFound };
  if (pay.status === "exempt") {
    return { ok: false, message: pe.monthExempt };
  }
  if (pay.status !== "pending") {
    return { ok: false, message: pe.alreadyProcessed };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const path = `${user.id}/${pay.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, message: pe.uploadFailed };

  const { error: upRow } = await supabase
    .from("payments")
    .update({
      receipt_url: path,
      amount,
      parent_id: user.id,
    })
    .eq("id", pay.id)
    .eq("status", "pending");

  if (upRow) return { ok: false, message: pe.uploadFailed };

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.paymentReceiptSubmittedParent,
    metadata: {
      month,
      year,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
    },
  });
  return { ok: true };
}
