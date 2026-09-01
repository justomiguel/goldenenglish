/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dictEn } from "@/test/dictEn";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
}));

vi.mock("@/lib/register/notifyRegistrationScheduleOffer", () => ({
  notifyRegistrationScheduleOffer: mocks.notify,
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { proposeRegistrationScheduleCore } from "@/lib/register/proposeRegistrationScheduleCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const FULL_SEC = "sec-full";
const NEW_SEC = "sec-open";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "section_full",
    fee_snapshot: { total: 80, currency: "CLP" },
    email: "ana@example.com",
    tutor_email: null,
    first_name: "Ana",
    last_name: "Perez",
    pay_token: "tok",
    preferred_section_id: FULL_SEC,
    proposed_section_id: null,
    additional_section_ids: [],
    birth_date: "2000-01-01",
    ...overrides,
  };
}

function mockAdmin(opts: {
  row?: Record<string, unknown> | null;
  seatOpen?: boolean;
} = {}) {
  const updated: { values?: Record<string, unknown> } = {};
  const admin = {
    from: (table: string) => {
      if (table === "registrations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.row === undefined ? lead() : opts.row,
                error: null,
              }),
            }),
          }),
          update: (values: Record<string, unknown>) => {
            updated.values = values;
            return {
              eq: async () => ({ error: null }),
            };
          },
        };
      }
      return {};
    },
    rpc: async (fn: string, args?: { p_section_id?: string }) => {
      if (fn === "registration_public_section_has_open_seat") {
        return { data: opts.seatOpen !== false, error: null };
      }
      if (fn === "registration_public_section_label") {
        const id = args?.p_section_id ?? "";
        return { data: id === NEW_SEC ? "A2 Tarde" : "A2 Mañana", error: null };
      }
      return { data: null, error: { message: fn } };
    },
    updated,
  };
  return admin as unknown as SupabaseClient & typeof admin;
}

describe("proposeRegistrationScheduleCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notify.mockResolvedValue(undefined);
  });

  it("writes proposed_section_id and offer_pending without touching preferred", async () => {
    const admin = mockAdmin();
    const result = await proposeRegistrationScheduleCore({
      admin,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
      sectionId: NEW_SEC,
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updated.values).toEqual({
      proposed_section_id: NEW_SEC,
      intake_state: "offer_pending",
    });
    expect(admin.updated.values).not.toHaveProperty("preferred_section_id");
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        originalSectionName: "A2 Mañana",
        proposedSectionName: "A2 Tarde",
        proposedScheduleLabel: "A2 Tarde",
      }),
    );
  });

  it("rejects the requested section as same_section and does not update", async () => {
    const admin = mockAdmin();
    const result = await proposeRegistrationScheduleCore({
      admin,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
      sectionId: FULL_SEC,
    });
    expect(result).toEqual({ ok: false, code: "same_section" });
    expect(admin.updated.values).toBeUndefined();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("rejects a full replacement and does not update", async () => {
    const admin = mockAdmin({ seatOpen: false });
    const result = await proposeRegistrationScheduleCore({
      admin,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
      sectionId: NEW_SEC,
    });
    expect(result).toEqual({ ok: false, code: "section_full" });
    expect(admin.updated.values).toBeUndefined();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("overwrites proposed_section_id on re-propose", async () => {
    const admin = mockAdmin({
      row: lead({
        intake_state: "offer_pending",
        proposed_section_id: "sec-old",
      }),
    });
    const result = await proposeRegistrationScheduleCore({
      admin,
      locale: "en",
      dict: dictEn,
      registrationId: REG_ID,
      sectionId: NEW_SEC,
    });
    expect(result).toEqual({ ok: true });
    expect(admin.updated.values).toMatchObject({
      proposed_section_id: NEW_SEC,
      intake_state: "offer_pending",
    });
    expect(mocks.notify).toHaveBeenCalled();
  });
});
