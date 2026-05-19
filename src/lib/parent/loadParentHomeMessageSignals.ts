import type { SupabaseClient } from "@supabase/supabase-js";
import { countStaffInboundThreadsForParent } from "@/lib/parent/countStaffInboundThreadsForParent";

export type ParentHomeMessageSignals = {
  staffInboundCount: number;
};

export async function loadParentHomeMessageSignals(
  supabase: SupabaseClient,
  parentId: string,
): Promise<ParentHomeMessageSignals> {
  const { data: raw } = await supabase
    .from("portal_messages")
    .select("sender_id, recipient_id")
    .or(`sender_id.eq.${parentId},recipient_id.eq.${parentId}`)
    .order("created_at", { ascending: false })
    .limit(400);

  const peerIds = new Set<string>();
  for (const row of raw ?? []) {
    peerIds.add(row.sender_id as string);
    peerIds.add(row.recipient_id as string);
  }

  const idList = [...peerIds];
  const { data: profiles } = idList.length
    ? await supabase.from("profiles").select("id, role").in("id", idList)
    : { data: [] as { id: string; role: string }[] };

  const roleByUserId = new Map((profiles ?? []).map((p) => [p.id as string, p.role as string]));

  return {
    staffInboundCount: countStaffInboundThreadsForParent(
      (raw ?? []) as { sender_id: string; recipient_id: string }[],
      parentId,
      roleByUserId,
    ),
  };
}
