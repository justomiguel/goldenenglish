import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type PortalMessagePeerMeta = {
  id: string;
  name: string;
  role: string;
};

const CHUNK = 200;

/** Role and display name for peers on one parent's own messages. Service role fills rows RLS hides. */
export async function loadPortalMessagePeerMeta(ids: string[]): Promise<PortalMessagePeerMeta[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];

  const admin = createAdminClient();
  const out: PortalMessagePeerMeta[] = [];

  for (let i = 0; i < unique.length; i += CHUNK) {
    const batch = unique.slice(i, i + CHUNK);
    const { data, error } = await admin
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("id", batch);
    if (error) {
      logSupabaseClientError("loadPortalMessagePeerMeta", error, { batchSize: batch.length });
      continue;
    }
    for (const row of data ?? []) {
      out.push({
        id: row.id as string,
        role: row.role as string,
        name: formatProfileSnakeSurnameFirst({
          first_name: row.first_name as string | null,
          last_name: row.last_name as string | null,
        }),
      });
    }
  }

  return out;
}
