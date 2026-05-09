"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getReceiptSignedUrl(
  objectPath: string,
): Promise<string | null> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("getReceiptSignedUrl");
    return null;
  }

  const trimmed = objectPath.trim();
  if (!trimmed || trimmed.includes("..")) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-receipts")
    .createSignedUrl(trimmed, 300);

  if (error || !data?.signedUrl) {
    if (error) logSupabaseClientError("getReceiptSignedUrl:storage", error, { path: trimmed });
    return null;
  }
  return data.signedUrl;
}
