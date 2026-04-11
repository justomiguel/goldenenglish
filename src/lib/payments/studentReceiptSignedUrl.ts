import type { SupabaseClient } from "@supabase/supabase-js";

/** Signed URL for the student's own receipt object path (RLS + path prefix check). */
export async function studentReceiptSignedUrl(
  supabase: SupabaseClient,
  userId: string,
  path: string | null,
): Promise<string | null> {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (p.includes("..")) return null;
  if (!p.startsWith(`${userId}/`)) return null;
  const { data, error } = await supabase.storage
    .from("payment-receipts")
    .createSignedUrl(p, 300);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
