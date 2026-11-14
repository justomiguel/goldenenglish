/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { applyEnrollmentGatewayCapture } from "@/lib/register/applyEnrollmentGatewayCapture";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "awaiting_fee",
    fee_captured: false,
    accepted_student_id: null,
    fee_snapshot: { total: 15000, currency: "CLP" },
    preferred_section_id: "sec-1",
    additional_section_ids: [],
    ...overrides,
  };
}

function mockAdmin(opts: {
  row?: Record<string, unknown> | null;
  seatOpen?: boolean;
} = {}) {
  const updates: Record<string, unknown>[] = [];
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: opts.row === undefined ? lead() : opts.row,
            error: null,
          }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        updates.push(values);
        return { eq: async () => ({ error: null }) };
      },
    }),
    rpc: async (fn: string) => {
      if (fn === "registration_public_section_has_open_seat") {
        return { data: opts.seatOpen !== false, error: null };
      }
      return { data: null, error: { message: fn } };
    },
    updates,
  };
  return admin as unknown as SupabaseClient & { updates: Record<string, unknown>[] };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applyEnrollmentGatewayCapture", () => {
  it("skips when the gateway amount does not match the snapshot", async () => {
    const admin = mockAdmin();
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 1,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true, skipped: "amount_mismatch" });
    expect(admin.updates).toEqual([]);
  });

  it("is a no-op when the lead is already enrolled", async () => {
    const admin = mockAdmin({ row: lead({ status: "enrolled", accepted_student_id: "stu-1" }) });
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true, skipped: "already_enrolled", studentId: "stu-1" });
    expect(admin.updates).toEqual([]);
  });

  it("marks the fee captured and leaves the lead without a section when the seat is open", async () => {
    const admin = mockAdmin();
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updates[0]).toMatchObject({
      fee_captured: true,
      enrollment_fee_paid_method: "gateway",
      intake_state: "needs_section",
    });
  });

  it("marks the fee captured and does not enroll when the requested seat is full", async () => {
    const admin = mockAdmin({ seatOpen: false });
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updates[0]).toMatchObject({
      fee_captured: true,
      enrollment_fee_paid_method: "gateway",
      intake_state: "needs_section",
    });
  });
});
