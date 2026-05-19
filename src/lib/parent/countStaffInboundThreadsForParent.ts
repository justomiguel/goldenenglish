import type { PortalMessageTail } from "@/lib/teacher/countFamilyInboundThreadsAwaitingReply";

/**
 * Messages must be newest-first. Counts distinct staff peers whose latest message
 * is inbound to the parent (teacher or admin) — proxy for "needs your attention".
 */
export function countStaffInboundThreadsForParent(
  msgs: PortalMessageTail[],
  parentId: string,
  roleByUserId: Map<string, string>,
): number {
  const seenPeer = new Set<string>();
  let count = 0;

  for (const message of msgs) {
    const peer = message.sender_id === parentId ? message.recipient_id : message.sender_id;
    if (seenPeer.has(peer)) continue;
    seenPeer.add(peer);

    if (message.recipient_id !== parentId) continue;

    const role = roleByUserId.get(message.sender_id) ?? "";
    if (role === "teacher" || role === "admin") count += 1;
  }

  return count;
}
