import { describe, expect, it } from "vitest";
import { isAdministrationBoundAdminInbound } from "@/lib/messaging/isAdministrationBoundAdminInbound";

// REGRESSION CHECK: Changing heuristics must not relabel teacher→admin or admin→admin DMs as Administration.

describe("isAdministrationBoundAdminInbound", () => {
  it("returns true when broadcast_batch_id is set", () => {
    expect(
      isAdministrationBoundAdminInbound({
        broadcastBatchId: "batch-1",
        senderRole: "teacher",
      }),
    ).toBe(true);
  });

  it("returns true for student, parent, and site_contact senders without batch id", () => {
    expect(
      isAdministrationBoundAdminInbound({ broadcastBatchId: null, senderRole: "student" }),
    ).toBe(true);
    expect(
      isAdministrationBoundAdminInbound({ broadcastBatchId: null, senderRole: "parent" }),
    ).toBe(true);
    expect(
      isAdministrationBoundAdminInbound({
        broadcastBatchId: null,
        senderRole: "site_contact",
      }),
    ).toBe(true);
  });

  it("returns false for teacher or admin person-to-person without batch id", () => {
    expect(
      isAdministrationBoundAdminInbound({ broadcastBatchId: null, senderRole: "teacher" }),
    ).toBe(false);
    expect(
      isAdministrationBoundAdminInbound({ broadcastBatchId: null, senderRole: "admin" }),
    ).toBe(false);
  });
});
