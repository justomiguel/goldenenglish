/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { switchRegistrationPaySectionCore } from "@/lib/register/switchRegistrationPaySectionCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const NEW_SEC = "sec-open";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "section_full",
    fee_captured: false,
    fee_snapshot: { total: 80, currency: "CLP", mode: "per_section" },
    preferred_section_id: "sec-full",
    additional_section_ids: [],
    ...overrides,
  };
}

function mockAdmin(opts: {
  row?: Record<string, unknown> | null;
  seatOpen?: boolean;
  sectionRows?: unknown[];
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
      if (table === "academic_sections") {
        return {
          select: () => ({
            in: async () => ({
              data:
                opts.sectionRows ??
                [
                  {
                    id: NEW_SEC,
                    name: "A2 Tarde",
                    enrollment_fee_amount: 90,
                    academic_cohorts: {
                      enrollment_fee_mode: "per_section",
                      default_enrollment_fee_amount: null,
                    },
                  },
                ],
              error: null,
            }),
          }),
        };
      }
      return {};
    },
    rpc: async (fn: string) => {
      if (fn === "registration_public_section_has_open_seat") {
        return { data: opts.seatOpen !== false, error: null };
      }
      return { data: null, error: { message: fn } };
    },
    updated,
  };
  return admin as unknown as SupabaseClient & typeof admin;
}

describe("switchRegistrationPaySectionCore", () => {
  it("moves the lead to the open section and rebuilds the snapshot", async () => {
    const admin = mockAdmin();
    const result = await switchRegistrationPaySectionCore({
      admin,
      payToken: "tok",
      sectionId: NEW_SEC,
      nowIso: "2026-08-28T12:00:00.000Z",
    });
    expect(result).toEqual({
      ok: true,
      needsAccept: false,
      intakeState: "awaiting_fee",
      registrationId: REG_ID,
    });
    expect(admin.updated.values).toMatchObject({
      preferred_section_id: NEW_SEC,
      intake_state: "awaiting_fee",
    });
    const snap = admin.updated.values?.fee_snapshot as { total?: number };
    expect(snap.total).toBe(90);
  });

  it("asks the accept core to run when the fee was already captured", async () => {
    const admin = mockAdmin({ row: lead({ fee_captured: true }) });
    const result = await switchRegistrationPaySectionCore({
      admin,
      payToken: "tok",
      sectionId: NEW_SEC,
      nowIso: "2026-08-28T12:00:00.000Z",
    });
    expect(result).toEqual({
      ok: true,
      needsAccept: true,
      intakeState: "awaiting_fee",
      registrationId: REG_ID,
    });
  });

  it("rejects when the lead is already enrolled", async () => {
    const result = await switchRegistrationPaySectionCore({
      admin: mockAdmin({ row: lead({ status: "enrolled" }) }),
      payToken: "tok",
      sectionId: NEW_SEC,
      nowIso: "2026-08-28T12:00:00.000Z",
    });
    expect(result).toEqual({ ok: false, code: "enrolled" });
  });

  it("rejects when the replacement section is also full", async () => {
    const result = await switchRegistrationPaySectionCore({
      admin: mockAdmin({ seatOpen: false }),
      payToken: "tok",
      sectionId: NEW_SEC,
      nowIso: "2026-08-28T12:00:00.000Z",
    });
    expect(result).toEqual({ ok: false, code: "section_full" });
  });
});
