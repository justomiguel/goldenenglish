"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
const approveSchema = z.object({
  receiptId: z.string().uuid(),
  locale: z.string().min(2).max(8),
});

const rejectSchema = z.object({
  receiptId: z.string().uuid(),
  locale: z.string().min(2).max(8),
  code: z.enum(["image_blurry", "amount_mismatch", "wrong_account", "other"]),
  detail: z.string().max(2000).optional(),
});

export async function approveBillingReceipt(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let supabase;
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.billingReview.forbidden };
  }

  const parsed = approveSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.billingReview.invalidData };
  }

  const errDict = await getDictionary(parsed.data.locale);
  const { data, error } = await supabase.rpc("admin_approve_billing_receipt", {
    p_receipt_id: parsed.data.receiptId,
  });

  if (error) {
    return { ok: false, message: errDict.actionErrors.billingReview.rpcFailed };
  }
  const row = data as { ok?: boolean; code?: string } | null;
  if (!row?.ok) {
    const code = row?.code === "forbidden" ? "forbidden" : "notFound";
    return {
      ok: false,
      message:
        code === "forbidden"
          ? errDict.actionErrors.billingReview.forbidden
          : errDict.actionErrors.billingReview.notFound,
    };
  }

  void recordSystemAudit({
    action: "billing_receipt_approved",
    resourceType: "billing_receipt",
    resourceId: parsed.data.receiptId,
  });

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/dashboard/admin/finance/receipts`);
  revalidatePath(`/${loc}/dashboard/admin/finance/receipts/${parsed.data.receiptId}`);
  revalidatePath(`/${loc}/dashboard/parent/billing`);
  revalidatePath(`/${loc}/dashboard/student/billing`);
  return { ok: true };
}

export async function rejectBillingReceipt(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let supabase;
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.billingReview.forbidden };
  }

  const parsed = rejectSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.billingReview.invalidData };
  }

  const errDict = await getDictionary(parsed.data.locale);
  const { data, error } = await supabase.rpc("admin_reject_billing_receipt", {
    p_receipt_id: parsed.data.receiptId,
    p_code: parsed.data.code,
    p_detail: parsed.data.detail ?? "",
  });

  if (error) {
    return { ok: false, message: errDict.actionErrors.billingReview.rpcFailed };
  }
  const row = data as { ok?: boolean; code?: string } | null;
  if (!row?.ok) {
    const code = row?.code === "forbidden" ? "forbidden" : "notFound";
    return {
      ok: false,
      message:
        code === "forbidden"
          ? errDict.actionErrors.billingReview.forbidden
          : errDict.actionErrors.billingReview.notFound,
    };
  }

  void recordSystemAudit({
    action: "billing_receipt_rejected",
    resourceType: "billing_receipt",
    resourceId: parsed.data.receiptId,
    payload: { code: parsed.data.code },
  });

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/dashboard/admin/finance/receipts`);
  revalidatePath(`/${loc}/dashboard/admin/finance/receipts/${parsed.data.receiptId}`);
  revalidatePath(`/${loc}/dashboard/parent/billing`);
  revalidatePath(`/${loc}/dashboard/student/billing`);
  return { ok: true };
}
