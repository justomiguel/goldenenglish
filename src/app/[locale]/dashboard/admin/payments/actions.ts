"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";

const reviewSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(2000).optional(),
});

export async function reviewPayment(
  raw: z.infer<typeof reviewSchema>,
): Promise<{ ok: boolean; message?: string }> {
  let supabase;
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
  } catch {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid data" };

  const { error } = await supabase
    .from("payments")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes ?? null,
    })
    .eq("id", parsed.data.paymentId);

  if (error) return { ok: false, message: error.message };
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
