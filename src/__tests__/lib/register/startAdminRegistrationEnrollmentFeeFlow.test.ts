/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/register/buildRegistrationEnrollmentFeeInsertFields", () => ({
  buildRegistrationEnrollmentFeeInsertFields: mocks.quote,
}));
vi.mock("@/lib/register/notifyRegistrationEnrollmentFeeDue", () => ({
  notifyRegistrationEnrollmentFeeDue: mocks.notify,
}));
vi.mock("@/lib/register/requestMailTenant", () => ({
  getRequestMailTenantDomain: async () => null,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));

import { startAdminRegistrationEnrollmentFeeFlow } from "@/lib/register/startAdminRegistrationEnrollmentFeeFlow";
import { dictEn } from "@/test/dictEn";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const SEC = "11111111-1111-4111-8111-111111111111";

function admin(opts: {
  lead?: Record<string, unknown> | null;
  open?: boolean;
  onUpdate?: (values: Record<string, unknown>) => void;
}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: opts.lead ?? null, error: null }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        opts.onUpdate?.(values);
        return { eq: async () => ({ error: null }) };
      },
    }),
    rpc: async () => ({ data: opts.open !== false, error: null }),
  };
}

const lead = {
  id: REG_ID,
  status: "new",
  intake_state: "none",
  fee_snapshot: null,
  fee_captured: false,
  email: "ana@example.com",
  tutor_email: null,
  tutor_name: null,
  first_name: "Ana",
  last_name: "Perez",
  pay_token: null,
  preferred_section_id: SEC,
  additional_section_ids: [],
  birth_date: "2000-01-01",
};

describe("startAdminRegistrationEnrollmentFeeFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.quote.mockResolvedValue({
      pay_token: "tok-1",
      fee_snapshot: { total: 80, currency: "CLP", lines: [{ sectionId: SEC, sectionName: "A1" }] },
      intake_state: "awaiting_fee",
      fee_captured: false,
    });
    mocks.notify.mockResolvedValue({ ok: true });
  });

  it("quotes, writes the pay token, and emails the family when seats are open", async () => {
    const updates: Record<string, unknown>[] = [];
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({ lead, onUpdate: (v) => { updates.push(v); } }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({
      pay_token: "tok-1",
      intake_state: "awaiting_fee",
    });
    expect(updates[0]?.enrollment_fee_mail_sent_at).toBeUndefined();
    expect(updates[1]).toHaveProperty("enrollment_fee_mail_sent_at");
    expect(mocks.notify).toHaveBeenCalled();
  });

  it("keeps the pay token when the lead already has one", async () => {
    const updates: Record<string, unknown>[] = [];
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({
        lead: { ...lead, pay_token: "kept-token" },
        onUpdate: (v) => { updates.push(v); },
      }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({ pay_token: "kept-token" });
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ payToken: "kept-token" }),
    );
  });

  it("does not save a pay link when the file has no family email", async () => {
    let updated: Record<string, unknown> | undefined;
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({
        lead: { ...lead, email: "", tutor_email: null },
        onUpdate: (v) => { updated = v; },
      }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: false, code: "no_family_email" });
    expect(updated).toBeUndefined();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("does not start the flow when the quote has no matrícula", async () => {
    mocks.quote.mockResolvedValue({
      pay_token: "tok-1",
      fee_snapshot: { total: 0, currency: "CLP", lines: [] },
      intake_state: "none",
      fee_captured: false,
    });
    let updated: Record<string, unknown> | undefined;
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({ lead, onUpdate: (v) => { updated = v; } }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: false, code: "no_fee" });
    expect(updated).toBeUndefined();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("quotes the cohort matrícula when the lead has no section", async () => {
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({
        lead: { ...lead, preferred_section_id: null },
      }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: true });
    expect(mocks.quote).toHaveBeenCalledWith(
      expect.objectContaining({ sectionIds: [] }),
    );
    expect(mocks.notify).toHaveBeenCalled();
  });

  it("marks the lead section_full and does not email when the section has no seat", async () => {
    let updated: Record<string, unknown> | undefined;
    const result = await startAdminRegistrationEnrollmentFeeFlow({
      admin: admin({ lead, open: false, onUpdate: (v) => { updated = v; } }) as never,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: false, code: "section_full" });
    expect(updated).toEqual({ intake_state: "section_full" });
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
