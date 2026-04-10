import { createAdminClient } from "@/lib/supabase/admin";

export async function receiptSignedUrlForAdmin(
  objectPath: string | null,
): Promise<string | null> {
  if (!objectPath?.trim()) return null;
  if (objectPath.includes("..")) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-receipts")
    .createSignedUrl(objectPath.trim(), 300);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
