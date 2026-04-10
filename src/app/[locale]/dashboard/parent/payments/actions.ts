"use server";

import { createClient } from "@/lib/supabase/server";

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
  const studentId = String(formData.get("studentId") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!studentId || !Number.isFinite(month) || !Number.isFinite(year)) {
    return { ok: false, message: "Invalid form" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Invalid amount" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Receipt file required" };
  }
  if (file.size > MAX_BYTES) return { ok: false, message: "File too large" };

  const mime = file.type || "application/octet-stream";
  if (
    !mime.startsWith("image/") &&
    mime !== "application/pdf"
  ) {
    return { ok: false, message: "Use PDF or image" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") return { ok: false, message: "Forbidden" };

  const { data: link } = await supabase
    .from("parent_student")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return { ok: false, message: "Student not linked" };

  const { data: pay, error: payErr } = await supabase
    .from("payments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (payErr || !pay) return { ok: false, message: "Payment slot not found" };
  if (pay.status !== "pending") {
    return { ok: false, message: "Payment already processed" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const path = `${user.id}/${pay.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, message: upErr.message };

  const { error: upRow } = await supabase
    .from("payments")
    .update({
      receipt_url: path,
      amount,
      parent_id: user.id,
    })
    .eq("id", pay.id)
    .eq("status", "pending");

  if (upRow) return { ok: false, message: upRow.message };
  return { ok: true };
}
