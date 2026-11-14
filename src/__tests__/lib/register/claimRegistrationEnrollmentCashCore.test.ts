/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  sendRegistrationAdminEmails: vi.fn(),
}));

vi.mock("@/lib/email/registrationIntakeEmails", () => ({
  sendRegistrationAdminEmails: mocks.sendRegistrationAdminEmails,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/site/requestPublicUrl", () => ({
  absoluteUrlForRequest: vi.fn(async () => null),
}));

import { claimRegistrationEnrollmentCashCore } from "@/lib/register/claimRegistrationEnrollmentCashCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "contacted",
    intake_state: "awaiting_fee",
    fee_captured: false,
    fee_snapshot: { total: 55000, currency: "ARS" },
    preferred_section_id: null,
    additional_section_ids: [],
    email: "ana@example.com",
    birth_date: "1990-06-15",
    tutor_email: null,
    first_name: "Ana",
    last_name: "Pérez",
    tutor_name: null,
    ...overrides,
  };
}

function mockAdmin(row: Record<string, unknown> | null = lead()) {
  const updated: { values?: Record<string, unknown> } = {};
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        updated.values = values;
        return { eq: async () => ({ error: null }) };
      },
    }),
    updated,
  };
  return admin as unknown as SupabaseClient & typeof admin;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("claimRegistrationEnrollmentCashCore", () => {
  it("stores the cash claim and does not capture the fee", async () => {
    const admin = mockAdmin();
    const result = await claimRegistrationEnrollmentCashCore({
      admin,
      payToken: "pay-token",
      locale: "es",
      sectionLabel: "horario por asignar",
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updated.values).toEqual({
      fee_snapshot: { total: 55000, currency: "ARS", familyClaim: "cash" },
    });
    expect(admin.updated.values).not.toHaveProperty("fee_captured");
    expect(admin.updated.values).not.toHaveProperty("intake_state");
    expect(mocks.sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: "registration.admin_cash_claimed" }),
    );
  });

  it("does not write again when the family already reported cash", async () => {
    const admin = mockAdmin(lead({ fee_snapshot: { total: 55000, currency: "ARS", familyClaim: "cash" } }));
    const result = await claimRegistrationEnrollmentCashCore({
      admin,
      payToken: "pay-token",
      locale: "es",
      sectionLabel: "horario por asignar",
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updated.values).toBeUndefined();
    expect(mocks.sendRegistrationAdminEmails).not.toHaveBeenCalled();
  });
});
