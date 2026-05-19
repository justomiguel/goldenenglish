import {
  buildPortalMessageTimelineLines,
  type RawPortalMessageRow,
} from "@/lib/messaging/buildPortalMessageTimelineLines";

export type { RawPortalMessageRow };

export type ParentPortalMessageLineDto = {
  id: string;
  from_me: boolean;
  body_html: string;
  created_at: string;
  peer_name: string;
  incoming_label: string;
};

export function buildParentPortalMessageLines(params: {
  userId: string;
  sortedAsc: RawPortalMessageRow[];
  peerById: Map<string, { name: string; role: string }>;
  labels: {
    messagesFromTeacher: string;
    messagesFromAdmin: string;
    administrationPeerLabel: string;
    emptyValue: string;
  };
}): ParentPortalMessageLineDto[] {
  return buildPortalMessageTimelineLines(params).map(
    ({ id, from_me, body_html, created_at, peer_name, incoming_label }) => ({
      id,
      from_me,
      body_html,
      created_at,
      peer_name,
      incoming_label,
    }),
  );
}
