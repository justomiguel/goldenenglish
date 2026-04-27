import { describe, expect, it, vi } from "vitest";
import { loadPaginatedAuditEvents } from "@/lib/dashboard/loadPaginatedAuditEvents";

function queryResult(result: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
}

describe("loadPaginatedAuditEvents", () => {
  it("applies the same filters to data and count queries", async () => {
    // REGRESSION CHECK: Audit is retained indefinitely, so the loader must keep
    // filtering and pagination on the server instead of fetching the full table.
    const dataQuery = queryResult({
      data: [
        {
          id: "audit-1",
          actor_id: "actor-1",
          actor_role: "admin",
          domain: "finance",
          action: "approve",
          resource_type: "payment",
          resource_id: "payment-1",
          summary: "Approved payment",
          before_values: {},
          after_values: {},
          diff: {},
          metadata: {},
          correlation_id: null,
          created_at: "2026-04-26T20:00:00Z",
        },
      ],
      error: null,
    });
    const countQuery = queryResult({ count: 1, error: null });
    const profileQuery = queryResult({
      data: [{ id: "actor-1", first_name: "Ada", last_name: "Admin" }],
      error: null,
    });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => dataQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => countQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => profileQuery) });

    const result = await loadPaginatedAuditEvents({ from } as never, {
      q: "payment",
      domain: "finance",
      action: "approve",
      resourceType: "payment",
      page: 2,
      sort: "created_at",
      dir: "desc",
    });

    expect(dataQuery.eq).toHaveBeenCalledWith("domain", "finance");
    expect(countQuery.eq).toHaveBeenCalledWith("domain", "finance");
    expect(dataQuery.or).toHaveBeenCalled();
    expect(countQuery.or).toHaveBeenCalled();
    expect(dataQuery.range).toHaveBeenCalledWith(25, 49);
    expect(result.rows[0]?.actorName).toBe("Ada Admin");
  });

  it("applies date range and actor to data and count (REGRESSION CHECK)", async () => {
    const actorUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const dataQuery = queryResult({ data: [], error: null });
    const countQuery = queryResult({ count: 0, error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => dataQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => countQuery) });

    await loadPaginatedAuditEvents({ from } as never, {
      dateFrom: "2026-04-01",
      dateTo: "2026-04-30",
      actorId: actorUuid,
    });

    expect(dataQuery.gte).toHaveBeenCalledWith("created_at", "2026-04-01T00:00:00.000Z");
    expect(countQuery.gte).toHaveBeenCalledWith("created_at", "2026-04-01T00:00:00.000Z");
    expect(dataQuery.lte).toHaveBeenCalledWith("created_at", "2026-04-30T23:59:59.999Z");
    expect(countQuery.lte).toHaveBeenCalledWith("created_at", "2026-04-30T23:59:59.999Z");
    expect(dataQuery.eq).toHaveBeenCalledWith("actor_id", actorUuid);
    expect(countQuery.eq).toHaveBeenCalledWith("actor_id", actorUuid);
  });
});
