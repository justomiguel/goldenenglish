/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  accept: vi.fn(),
  getDictionary: vi.fn(),
}));

vi.mock("@/lib/register/acceptRegistrationLead", () => ({
  acceptRegistrationLead: mocks.accept,
}));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
  defaultLocale: "es",
}));
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
  mocks.getDictionary.mockResolvedValue({ register: {} });
  mocks.accept.mockResolvedValue({ ok: true, studentId: "stu-1", pendingSectionIds: [] });
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
    expect(mocks.accept).not.toHaveBeenCalled();
    expect(admin.updates).toEqual([]);
  });

  it("is a no-op when the lead is already enrolled", async () => {
    const result = await applyEnrollmentGatewayCapture({
      admin: mockAdmin({ row: lead({ status: "enrolled", accepted_student_id: "stu-1" }) }),
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true, skipped: "already_enrolled", studentId: "stu-1" });
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("marks fee_captured and accepts when the seat is still open", async () => {
    const admin = mockAdmin();
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true, studentId: "stu-1" });
    expect(admin.updates[0]).toMatchObject({ fee_captured: true });
    expect(mocks.accept).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationId: REG_ID,
        paidCapture: true,
        enrollClient: admin,
      }),
    );
  });

  it("marks fee_captured and section_full without accepting when the seat vanished", async () => {
    const admin = mockAdmin({ seatOpen: false });
    const result = await applyEnrollmentGatewayCapture({
      admin,
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
    expect(result).toEqual({ ok: true, skipped: "section_full" });
    expect(mocks.accept).not.toHaveBeenCalled();
    expect(admin.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fee_captured: true }),
        expect.objectContaining({ intake_state: "section_full" }),
      ]),
    );
  });
});
