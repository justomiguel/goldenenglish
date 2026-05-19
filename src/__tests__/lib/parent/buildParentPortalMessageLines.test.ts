import { describe, it, expect } from "vitest";
import { buildParentPortalMessageLines } from "@/lib/parent/buildParentPortalMessageLines";

describe("buildParentPortalMessageLines", () => {
  const labels = {
    messagesFromTeacher: "Teacher",
    messagesFromAdmin: "Administration",
    administrationPeerLabel: "Administration",
    emptyValue: "—",
  };

  it("collapses duplicate admin broadcast rows into one timeline entry", () => {
    const peerById = new Map([
      ["a1", { name: "Admin One", role: "admin" }],
      ["a2", { name: "Admin Two", role: "admin" }],
    ]);
    const lines = buildParentPortalMessageLines({
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
          sender_id: "p1",
          recipient_id: "a2",
          body_html: "<p>hi</p>",
          created_at: "2026-01-01T10:00:01Z",
          broadcast_batch_id: "batch-1",
        },
      ],
      peerById,
      labels,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.peer_name).toBe("Administration");
    expect(lines[0]?.from_me).toBe(true);
    expect(lines[0]?.outbound_administration).toBe(true);
  });

  it("collapses admin broadcast when admin profiles are hidden from parent RLS", () => {
    const lines = buildParentPortalMessageLines({
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
          sender_id: "p1",
          recipient_id: "a2",
          body_html: "<p>hi</p>",
          created_at: "2026-01-01T10:00:01Z",
          broadcast_batch_id: "batch-1",
        },
      ],
      peerById: new Map(),
      labels,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.peer_name).toBe("Administration");
    expect(lines[0]?.outbound_administration).toBe(true);
  });

  it("treats outbound rows to admin ids as administration without broadcast_batch_id", () => {
    const lines = buildParentPortalMessageLines({
      userId: "p1",
      sortedAsc: [
        {
          id: "m1",
          sender_id: "p1",
          recipient_id: "a1",
          body_html: "<p>legacy</p>",
          created_at: "2026-01-01T10:00:00Z",
          broadcast_batch_id: null,
        },
        {
          id: "m2",
          sender_id: "p1",
          recipient_id: "a2",
          body_html: "<p>legacy</p>",
          created_at: "2026-01-01T10:00:01Z",
          broadcast_batch_id: null,
        },
      ],
      peerById: new Map(),
      adminRecipientIds: new Set(["a1", "a2"]),
      labels,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.outbound_administration).toBe(true);
    expect(lines[0]?.peer_name).toBe("Administration");
  });
});
