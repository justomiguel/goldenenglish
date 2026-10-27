/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { previewEventDiscountCode } from "@/lib/events/server/previewEventDiscountCode";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging/serverActionLog", () => ({ logSupabaseClientError: vi.fn() }));

function adminFor(input: {
  code: { id: string; discount_percent: number; max_uses: number | null } | null;
  occupied: number;
}) {
  const calls: string[] = [];
  const admin = {
    from(table: string) {
      calls.push(table);
      if (table === "event_discount_codes") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: input.code, error: null }),
              }),
            }),
          }),
          insert: () => {
            throw new Error("preview must not insert");
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({
            in: async () => ({ count: input.occupied, error: null }),
          }),
        }),
        insert: () => {
          throw new Error("preview must not insert");
        },
      };
    },
  };
  return { admin: admin as unknown as SupabaseClient, calls };
}

describe("previewEventDiscountCode", () => {
  it("returns the discounted amount and does not insert a redemption", async () => {
    const { admin, calls } = adminFor({
      code: { id: "code-1", discount_percent: 50, max_uses: 2 },
      occupied: 1,
    });
    const result = await previewEventDiscountCode(admin, {
      eventId: "event-1",
      code: " Save10 ",
      amount: 10000,
      currency: "CLP",
    });
    expect(result).toEqual({ ok: true, kind: "percent", percent: 50, amount: 5000 });
    expect(calls).not.toContain("insert");
  });

  it("returns no_uses when reserved and consumed uses fill the cap", async () => {
    const { admin } = adminFor({
      code: { id: "code-1", discount_percent: 10, max_uses: 1 },
      occupied: 1,
    });
    const result = await previewEventDiscountCode(admin, {
      eventId: "event-1",
      code: "SAVE10",
      amount: 10000,
      currency: "CLP",
    });
    expect(result).toEqual({ ok: false, code: "no_uses" });
  });

  it("rejects a blank code, a failed lookup, and a missing row", async () => {
    const blank = await previewEventDiscountCode({} as SupabaseClient, {
      eventId: "event-1",
      code: "   ",
      amount: 10000,
      currency: "CLP",
    });
    expect(blank).toEqual({ ok: false, code: "invalid_code" });

    const tooLong = await previewEventDiscountCode({} as SupabaseClient, {
      eventId: "event-1",
      code: "x".repeat(33),
      amount: 10000,
      currency: "CLP",
    });
    expect(tooLong).toEqual({ ok: false, code: "invalid_code" });

    const failed = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: { message: "down" } }),
            }),
          }),
        }),
      }),
    };
    expect(
      await previewEventDiscountCode(failed as unknown as SupabaseClient, {
        eventId: "event-1",
        code: "SAVE",
        amount: 10000,
        currency: "CLP",
      }),
    ).toEqual({ ok: false, code: "invalid_code" });

    const missing = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
        }),
      }),
    };
    expect(
      await previewEventDiscountCode(missing as unknown as SupabaseClient, {
        eventId: "event-1",
        code: "SAVE",
        amount: 10000,
        currency: "CLP",
      }),
    ).toEqual({ ok: false, code: "invalid_code" });
  });

  it("returns a fixed amount and treats a count error as an invalid code", async () => {
    const amountAdmin = {
      from(table: string) {
        if (table === "event_discount_codes") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "code-1",
                      discount_percent: null,
                      discount_amount: 1500,
                      ticket_count: 2,
                      max_uses: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error("count is not needed");
      },
    };
    expect(
      await previewEventDiscountCode(amountAdmin as unknown as SupabaseClient, {
        eventId: "event-1",
        code: "FIJO",
        amount: 10000,
        currency: "CLP",
      }),
    ).toEqual({ ok: true, kind: "amount", discountAmount: 1500, ticketCount: 2 });

    const countFailed = {
      from(table: string) {
        if (table === "event_discount_codes") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "code-1", discount_percent: 10, max_uses: 3 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({ count: null, error: { message: "count" } }),
            }),
          }),
        };
      },
    };
    expect(
      await previewEventDiscountCode(countFailed as unknown as SupabaseClient, {
        eventId: "event-1",
        code: "SAVE",
        amount: 10000,
        currency: "CLP",
      }),
    ).toEqual({ ok: false, code: "invalid_code" });
  });
});
