import type { StudentPortalMessageLineDto } from "@/types/studentPortal";

export type RawPortalMessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body_html: string;
  created_at: string;
  broadcast_batch_id: string | null;
};

type PeerMeta = { name: string; role: string };

/**
 * Builds timeline lines for the student portal; collapses broadcast student→admin sends into one card.
 */
export function buildStudentPortalMessageLines(params: {
  userId: string;
  sortedAsc: RawPortalMessageRow[];
  peerById: Map<string, PeerMeta>;
  labels: {
    messagesFromTeacher: string;
    messagesFromAdmin: string;
    administrationPeerLabel: string;
    emptyValue: string;
  };
}): StudentPortalMessageLineDto[] {
  const { userId, sortedAsc, peerById, labels } = params;

  const canonicalBroadcastIdByBatch = new Map<string, string>();
  for (const m of sortedAsc) {
    if (m.sender_id !== userId || !m.broadcast_batch_id) continue;
    const recipientRole = peerById.get(m.recipient_id)?.role ?? "";
    if (recipientRole !== "admin") continue;
    const batch = m.broadcast_batch_id;
    if (!canonicalBroadcastIdByBatch.has(batch)) {
      canonicalBroadcastIdByBatch.set(batch, m.id);
    }
  }

  const lines: StudentPortalMessageLineDto[] = [];

  for (const m of sortedAsc) {
    const fromMe = m.sender_id === userId;
    const peerId = fromMe ? m.recipient_id : m.sender_id;
    const peer = peerById.get(peerId);
    const peerRole = peer?.role ?? "student";
    let peerName = peer?.name ?? labels.emptyValue;

    if (
      fromMe &&
      m.broadcast_batch_id &&
      peerRole === "admin" &&
      canonicalBroadcastIdByBatch.get(m.broadcast_batch_id) !== m.id
    ) {
      continue;
    }

    if (fromMe && m.broadcast_batch_id && peerRole === "admin") {
      peerName = labels.administrationPeerLabel;
    }

    let incomingLabel = labels.messagesFromTeacher;
    if (peerRole === "admin") {
      incomingLabel = labels.messagesFromAdmin;
    }

    let canDelete = false;
    if (fromMe && m.broadcast_batch_id && peerRole === "admin") {
      const hasStaffReply = sortedAsc.some((o) => {
        if (o.recipient_id !== userId) return false;
        if (new Date(o.created_at).getTime() <= new Date(m.created_at).getTime()) return false;
        const sr = peerById.get(o.sender_id)?.role ?? "";
        return sr === "teacher" || sr === "admin";
      });
      canDelete = !hasStaffReply;
    } else if (fromMe && (peerRole === "teacher" || peerRole === "admin")) {
      const hasStaffReply = sortedAsc.some(
        (o) =>
          o.sender_id === peerId &&
          o.recipient_id === userId &&
          new Date(o.created_at) > new Date(m.created_at),
      );
      canDelete = !hasStaffReply;
    }

    lines.push({
      id: m.id,
      from_me: fromMe,
      body_html: m.body_html,
      created_at: m.created_at,
      can_delete: canDelete,
      peer_name: peerName,
      incoming_label: incomingLabel,
      broadcast_batch_id: m.broadcast_batch_id,
    });
  }

  return lines;
}
