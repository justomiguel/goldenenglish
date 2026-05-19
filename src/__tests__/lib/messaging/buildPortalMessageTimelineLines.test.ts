import { describe, it, expect } from "vitest";
import { buildPortalMessageTimelineLines } from "@/lib/messaging/buildPortalMessageTimelineLines";

describe("buildPortalMessageTimelineLines", () => {
  const labels = {
    messagesFromTeacher: "Teacher",
    messagesFromAdmin: "Administration",
    administrationPeerLabel: "Administration",
    emptyValue: "—",
  };

  it("labels inbound admin replies when admin profile is not visible", () => {
    const lines = buildPortalMessageTimelineLines({
      userId: "p1",
      sortedAsc: [
        {
          id: "m1",
          sender_id: "p1",
          recipient_id: "a1",
          body_html: "<p>hi</p>",
          created_at: "2026-01-01T10:00:00Z",
          broadcast_batch_id: "batch-1",
        },
        {
          id: "m2",
          sender_id: "a1",
          recipient_id: "p1",
          body_html: "<p>reply</p>",
          created_at: "2026-01-01T11:00:00Z",
          broadcast_batch_id: null,
        },
      ],
      peerById: new Map(),
      adminRecipientIds: new Set(["a1"]),
      labels,
    });
    expect(lines).toHaveLength(2);
    expect(lines[1]?.incoming_label).toBe("Administration");
  });
});
