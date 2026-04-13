import { describe, expect, it, vi } from "vitest";
import { getFinancialBillingContext } from "@/lib/billing/getFinancialBillingContext";

function mockSupabase(isMinor: boolean | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: isMinor == null ? null : { is_minor: isMinor },
            error: null,
          }),
        })),
      })),
    })),
  } as never;
}

describe("getFinancialBillingContext", () => {
  it("returns managesSelf true when profile is not minor", async () => {
    const r = await getFinancialBillingContext(mockSupabase(false), "u1");
    expect(r.managesSelf).toBe(true);
  });

  it("returns managesSelf false when profile is minor", async () => {
    const r = await getFinancialBillingContext(mockSupabase(true), "u1");
    expect(r.managesSelf).toBe(false);
  });

  it("treats missing profile as adult (not minor)", async () => {
    const r = await getFinancialBillingContext(mockSupabase(null), "u1");
    expect(r.managesSelf).toBe(true);
  });
});
