/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordAuditEvent } from "@/lib/audit/recordAuditEvent";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

describe("recordAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
  });

  it("inserts a sanitized audit row with calculated diff", async () => {
    const result = await recordAuditEvent({
      actorId: "actor-1",
      actorRole: "teacher",
      domain: "sections",
      action: "update",
      resourceType: "section_attendance",
      resourceId: "section-1",
      summary: "Teacher updated attendance",
      beforeValues: { status: "absent", amount_cents: 1000 },
      afterValues: { status: "present", amount_cents: 1000, token: "x" },
      metadata: { authorization: "Bearer x", reason: "correction" },
    });

    expect(result).toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith("audit_events");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "actor-1",
        actor_role: "teacher",
        domain: "sections",
        action: "update",
        resource_type: "section_attendance",
        resource_id: "section-1",
        after_values: {
          status: "present",
          amount_cents: 1000,
          token: "[REDACTED]",
        },
        diff: {
          status: { before: "absent", after: "present" },
          token: { before: null, after: "[REDACTED]" },
        },
        metadata: { authorization: "[REDACTED]", reason: "correction" },
      }),
    );
  });

  it("returns ok false when insert fails", async () => {
    insertMock.mockResolvedValueOnce({ error: { message: "nope" } });

    const result = await recordAuditEvent({
      actorId: "actor-1",
      domain: "finance",
      action: "approve",
      resourceType: "payment",
      summary: "Payment approved",
    });

    expect(result).toEqual({ ok: false });
  });
});
