import {
  buildPortalMessageTimelineLines,
  type RawPortalMessageRow,
} from "@/lib/messaging/buildPortalMessageTimelineLines";
import type { StudentPortalMessageLineDto } from "@/types/studentPortal";

export type { RawPortalMessageRow };

/**
 * Builds timeline lines for the student portal; collapses broadcast student→admin sends into one card.
 */
export function buildStudentPortalMessageLines(params: {
  userId: string;
  sortedAsc: RawPortalMessageRow[];
  peerById: Map<string, { name: string; role: string }>;
  labels: {
    messagesFromTeacher: string;
    messagesFromAdmin: string;
    administrationPeerLabel: string;
    emptyValue: string;
  };
}): StudentPortalMessageLineDto[] {
  return buildPortalMessageTimelineLines(params);
}
