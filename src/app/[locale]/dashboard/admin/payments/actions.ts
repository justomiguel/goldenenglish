"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";

const reviewSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(2000).optional(),
  locale: z.string().min(2).max(8),
});

export async function reviewPayment(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let supabase;
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.paymentsReview.forbidden };
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.paymentsReview.invalidData };
  }

  const errDict = await getDictionary(parsed.data.locale);

  const { error } = await supabase
    .from("payments")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes ?? null,
    })
    .eq("id", parsed.data.paymentId);

  if (error) return { ok: false, message: errDict.actionErrors.paymentsReview.saveFailed };
  return { ok: true };
}

export async function getReceiptSignedUrl(
  objectPath: string,
): Promise<string | null> {
  try {
    await assertAdmin();
  } catch {
    return null;
  }

  const trimmed = objectPath.trim();
  if (!trimmed || trimmed.includes("..")) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-receipts")
    .createSignedUrl(trimmed, 300);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
