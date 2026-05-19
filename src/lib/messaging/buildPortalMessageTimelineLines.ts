export type RawPortalMessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body_html: string;
  created_at: string;
  broadcast_batch_id: string | null;
};

type PeerMeta = { name: string; role: string };

function isAdminRecipient(
  peerId: string,
  adminRecipientIds: ReadonlySet<string> | undefined,
): boolean {
  return adminRecipientIds?.has(peerId) ?? false;
}

/** Parent/student → administration (one row per admin inbox). */
function isAdministrationOutbound(
  m: RawPortalMessageRow,
  userId: string,
  adminRecipientIds: ReadonlySet<string> | undefined,
): boolean {
  if (m.sender_id !== userId) return false;
  if (m.broadcast_batch_id != null) return true;
  return isAdminRecipient(m.recipient_id, adminRecipientIds);
}

/** Same compose burst to multiple admins may differ by a few seconds without batch id. */
function adminSendDedupeKey(m: RawPortalMessageRow): string {
  return `${m.body_html}::${m.created_at.slice(0, 16)}`;
}

function inferPeerRole(
  peerId: string,
  peer: PeerMeta | undefined,
  userId: string,
  sortedAsc: RawPortalMessageRow[],
  adminRecipientIds: ReadonlySet<string> | undefined,
): string {
  if (peer?.role) return peer.role;
  if (isAdminRecipient(peerId, adminRecipientIds)) return "admin";
  const linkedToAdminBroadcast = sortedAsc.some(
    (row) =>
      row.sender_id === userId &&
      isAdministrationOutbound(row, userId, adminRecipientIds) &&
      row.recipient_id === peerId,
  );
  if (linkedToAdminBroadcast) return "admin";
  return "student";
}

function staffRole(
  profileId: string,
  peerById: Map<string, PeerMeta>,
  userId: string,
  sortedAsc: RawPortalMessageRow[],
  adminRecipientIds: ReadonlySet<string> | undefined,
): string {
  return inferPeerRole(profileId, peerById.get(profileId), userId, sortedAsc, adminRecipientIds);
}

export type PortalMessageTimelineLine = {
  id: string;
  from_me: boolean;
  body_html: string;
  created_at: string;
  peer_name: string;
  incoming_label: string;
  can_delete: boolean;
  broadcast_batch_id: string | null;
  outbound_administration: boolean;
};

/**
 * Timeline for portal messaging; collapses broadcast sends to admin into one card.
 */
export function buildPortalMessageTimelineLines(params: {
  userId: string;
  sortedAsc: RawPortalMessageRow[];
  peerById: Map<string, PeerMeta>;
  adminRecipientIds?: ReadonlySet<string>;
  labels: {
    messagesFromTeacher: string;
    messagesFromAdmin: string;
    administrationPeerLabel: string;
    emptyValue: string;
  };
}): PortalMessageTimelineLine[] {
  const { userId, sortedAsc, peerById, adminRecipientIds, labels } = params;

  const canonicalBroadcastIdByBatch = new Map<string, string>();
  const canonicalAdminSendByBodyTime = new Map<string, string>();

  for (const m of sortedAsc) {
    if (!isAdministrationOutbound(m, userId, adminRecipientIds)) continue;
    if (m.broadcast_batch_id) {
      const batch = m.broadcast_batch_id;
      if (!canonicalBroadcastIdByBatch.has(batch)) {
        canonicalBroadcastIdByBatch.set(batch, m.id);
      }
      continue;
    }
    const dedupeKey = adminSendDedupeKey(m);
    if (!canonicalAdminSendByBodyTime.has(dedupeKey)) {
      canonicalAdminSendByBodyTime.set(dedupeKey, m.id);
    }
  }

  const lines: PortalMessageTimelineLine[] = [];

  for (const m of sortedAsc) {
    const fromMe = m.sender_id === userId;
    const peerId = fromMe ? m.recipient_id : m.sender_id;
    const peer = peerById.get(peerId);
    const peerRole = inferPeerRole(peerId, peer, userId, sortedAsc, adminRecipientIds);
    let peerName = peer?.name ?? labels.emptyValue;
    const adminOutbound = isAdministrationOutbound(m, userId, adminRecipientIds);

    if (adminOutbound) {
      if (
        m.broadcast_batch_id &&
        canonicalBroadcastIdByBatch.get(m.broadcast_batch_id) !== m.id
      ) {
        continue;
      }
      if (
        !m.broadcast_batch_id &&
        canonicalAdminSendByBodyTime.get(adminSendDedupeKey(m)) !== m.id
      ) {
        continue;
      }
    }

    if (adminOutbound) {
      peerName = labels.administrationPeerLabel;
    }

    let incomingLabel = labels.messagesFromTeacher;
    if (peerRole === "admin") {
      incomingLabel = labels.messagesFromAdmin;
    }

    let canDelete = false;
    if (adminOutbound) {
      const hasStaffReply = sortedAsc.some((o) => {
        if (o.recipient_id !== userId) return false;
        if (new Date(o.created_at).getTime() <= new Date(m.created_at).getTime()) return false;
        const sr = staffRole(o.sender_id, peerById, userId, sortedAsc, adminRecipientIds);
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
      outbound_administration: adminOutbound,
    });
  }

  return lines;
}
