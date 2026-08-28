/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { loadAdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";

describe("loadAdminHubSummary registrations", () => {
  it("counts urgent separately from waiting payment and ignores enrolled", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [] }),
      from: vi.fn((table: string) => {
        if (table === "registrations") {
          return {
            select: () => ({
              neq: async () => ({
                data: [
                  { status: "new", intake_state: "none", fee_snapshot: { total: 0 } },
                  { status: "new", intake_state: "receipt_pending", fee_snapshot: { total: 80 } },
                  { status: "new", intake_state: "awaiting_fee", fee_snapshot: { total: 80 } },
                  { status: "new", intake_state: "none", fee_snapshot: { total: 80 } },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }),
    };
    const admin = {
      rpc: vi.fn().mockResolvedValue({
        data: { total: 0, by_role: [], students_without_section: 0 },
      }),
    };

    const summary = await loadAdminHubSummary(supabase as never, admin as never, "admin-1");
    expect(summary.registrations).toEqual({
      newCount: 2,
      awaitingFeeCount: 2,
      totalCount: 4,
    });
  });
});
