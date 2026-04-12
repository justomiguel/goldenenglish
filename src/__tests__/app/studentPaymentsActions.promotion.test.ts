/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { applyPromotionCodeForStudent } from "@/app/[locale]/dashboard/student/payments/actions";
import { mockCreateClient } from "./studentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/email/billingBenefitEmails", () => ({
  sendPromotionAppliedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(() => Promise.resolve({ ok: true })),
}));

function clientStudentSelf() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "s1" } } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { is_minor: false },
            error: null,
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: { ok: true, promotion_name: "P", code_snapshot: "C1" },
      error: null,
    }),
  };
}

function clientParentForStudent() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "p1" } } }),
    },
    from: vi.fn((table: string) => {
      if (table === "tutor_student_rel") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { student_id: "s1" },
            error: null,
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: { ok: true, promotion_name: "P", code_snapshot: "C1" },
      error: null,
    }),
  };
}

describe("applyPromotionCodeForStudent analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call analytics for empty code", async () => {
    expect(await applyPromotionCodeForStudent("en", "s1", "   ")).toEqual({
      ok: false,
      message: "Empty code",
    });
    expect(recordUserEventServer).not.toHaveBeenCalled();
  });

  it("records funnel event when student applies promotion", async () => {
    mockCreateClient.mockResolvedValue(clientStudentSelf());
    expect(await applyPromotionCodeForStudent("en", "s1", "SAVE10")).toEqual({
      ok: true,
    });
    expect(recordUserEventServer).toHaveBeenCalledWith({
      userId: "s1",
      eventType: "action",
      entity: AnalyticsEntity.promotionCodeAppliedStudent,
      metadata: { applied_by: "student" },
    });
  });

  it("records applied_by parent when tutor applies for student", async () => {
    mockCreateClient.mockResolvedValue(clientParentForStudent());
    expect(await applyPromotionCodeForStudent("en", "s1", "SAVE10")).toEqual({
      ok: true,
    });
    expect(recordUserEventServer).toHaveBeenCalledWith({
      userId: "p1",
      eventType: "action",
      entity: AnalyticsEntity.promotionCodeAppliedStudent,
      metadata: { applied_by: "parent" },
    });
  });
});
