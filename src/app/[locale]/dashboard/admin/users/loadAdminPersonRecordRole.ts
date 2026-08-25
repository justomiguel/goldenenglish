import { createAdminClient } from "@/lib/supabase/admin";

export async function loadAdminPersonRecordRole(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return typeof data?.role === "string" ? data.role : null;
}
