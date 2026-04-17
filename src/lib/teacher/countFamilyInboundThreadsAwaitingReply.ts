export type PortalMessageTail = {
  sender_id: string;
  recipient_id: string;
};

/**
 * Messages must be newest-first. Counts distinct peers whose latest message is
 * inbound to the teacher from a student or parent (proxy for "needs attention").
 */
export function countFamilyInboundThreadsAwaitingReply(
  msgs: PortalMessageTail[],
  teacherId: string,
  roleByUserId: Map<string, string>,
): number {
  const seenPeer = new Set<string>();
  let n = 0;
  for (const m of msgs) {
    const peer = m.sender_id === teacherId ? m.recipient_id : m.sender_id;
    if (seenPeer.has(peer)) continue;
    seenPeer.add(peer);
    const inbound = m.recipient_id === teacherId;
    if (!inbound) continue;
    const role = roleByUserId.get(m.sender_id) ?? "";
    if (role === "student" || role === "parent") n += 1;
  }
  return n;
}
