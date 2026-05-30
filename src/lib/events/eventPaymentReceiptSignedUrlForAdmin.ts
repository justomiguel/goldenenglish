import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function eventPaymentReceiptSignedUrlForAdmin(
  objectPath: string | null | undefined,
): Promise<string | null> {
  const trimmed = objectPath?.trim();
  if (!trimmed || trimmed.includes("..")) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("event-uploads").createSignedUrl(trimmed, 300);

  if (error || !data?.signedUrl) {
    if (error) {
      logSupabaseClientError("eventPaymentReceiptSignedUrlForAdmin:storage", error, { path: trimmed });
    }
    return null;
  }

  return data.signedUrl;
}
