/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";

const insertMock = vi.fn();
const mockAssertAdmin = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

describe("recordSystemAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    mockAssertAdmin.mockResolvedValue({
      supabase: {
        from: vi.fn(() => ({
          insert: insertMock,
        })),
      },
      user: { id: "admin-1" },
    });
  });

  it("returns ok:true on successful insert", async () => {
    const r = await recordSystemAudit({
      action: "update",
      resourceType: "settings",
      resourceId: "x",
      payload: { a: 1 },
    });
    expect(r).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalled();
  });

  it("returns ok:false when insert returns error", async () => {
    insertMock.mockResolvedValue({ error: { message: "e" } });
    const r = await recordSystemAudit({
      action: "update",
      resourceType: "settings",
    });
    expect(r).toEqual({ ok: false });
  });

  it("returns ok:false when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValueOnce(new Error("forbidden"));
    const r = await recordSystemAudit({
      action: "x",
      resourceType: "y",
    });
    expect(r).toEqual({ ok: false });
  });
});
