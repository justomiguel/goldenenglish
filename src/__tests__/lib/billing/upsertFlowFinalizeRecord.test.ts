import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertFlowFinalizeRecord } from "@/lib/billing/upsertFlowFinalizeRecord";

const PAYMENT_ID = "11111111-1111-4111-8111-111111111111";

function adminWithUpsertCapture() {
  const upsert = vi.fn(async () => ({ error: null }));
  const admin = {
    from: vi.fn((table: string) => {
      if (table !== "payment_flow_finalize_records") {
        throw new Error(`unexpected table ${table}`);
      }
      return { upsert };
    }),
  } as unknown as SupabaseClient;
  return { admin, upsert };
}

describe("upsertFlowFinalizeRecord", () => {
  it("uses ON CONFLICT(payment_id) ignoreDuplicates so concurrent calls are safe", async () => {
    const { admin, upsert } = adminWithUpsertCapture();
    const r = await upsertFlowFinalizeRecord({
      admin,
      paymentId: PAYMENT_ID,
      snapshot: {
        flowOrder: 999,
        commerceOrder: "MES-2026-05-00000123",
        status: 2,
        amount: 12500,
        currency: "CLP",
        payer: "p@example.com",
        paymentData: { date: "2026-05-10 20:30:00", media: "Webpay" },
      },
    });
    expect(r.ok).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(1);
    const [row, opts] = upsert.mock.calls[0] as [Record<string, unknown>, { onConflict?: string; ignoreDuplicates?: boolean }];
    expect(opts).toEqual({ onConflict: "payment_id", ignoreDuplicates: true });
    expect(row).toMatchObject({
      payment_id: PAYMENT_ID,
      flow_order: 999,
      commerce_order: "MES-2026-05-00000123",
      currency: "CLP",
      amount: 12500,
      payer_email: "p@example.com",
      media_label: "Webpay",
    });
    expect(row.paid_at).toBe("2026-05-10T20:30:00.000Z");
  });

  it("persists settlement fields (fee, balance, transfer_date, conversion_rate/date) when Flow reports them", async () => {
    const { admin, upsert } = adminWithUpsertCapture();
    await upsertFlowFinalizeRecord({
      admin,
      paymentId: PAYMENT_ID,
      snapshot: {
        flowOrder: 1,
        commerceOrder: "x",
        status: 2,
        amount: 1000,
        currency: "CLP",
        paymentData: {
          fee: 30,
          balance: 970,
          transferDate: "2026-05-12 00:00:00",
          conversionRate: 1.0,
          conversionDate: "2026-05-10 20:55:00",
        },
      },
    });
    const [row] = upsert.mock.calls[0] as [Record<string, unknown>];
    expect(row).toMatchObject({
      fee: 30,
      balance: 970,
      conversion_rate: 1.0,
    });
    expect(row.transfer_date).toBe("2026-05-12T00:00:00.000Z");
    expect(row.conversion_date).toBe("2026-05-10T20:55:00.000Z");
  });

  it("leaves settlement fields null when Flow omits paymentData fields", async () => {
    const { admin, upsert } = adminWithUpsertCapture();
    await upsertFlowFinalizeRecord({
      admin,
      paymentId: PAYMENT_ID,
      snapshot: { flowOrder: 1, commerceOrder: "x", status: 2, amount: 1, currency: "CLP" },
    });
    const [row] = upsert.mock.calls[0] as [Record<string, unknown>];
    expect(row.fee).toBeNull();
    expect(row.balance).toBeNull();
    expect(row.transfer_date).toBeNull();
    expect(row.conversion_rate).toBeNull();
    expect(row.conversion_date).toBeNull();
  });

  it("falls back to now() when Flow paymentData.date is missing", async () => {
    const { admin, upsert } = adminWithUpsertCapture();
    const before = Date.now();
    await upsertFlowFinalizeRecord({
      admin,
      paymentId: PAYMENT_ID,
      snapshot: {
        flowOrder: 1,
        commerceOrder: "X",
        status: 2,
        amount: 1,
        currency: "CLP",
      },
    });
    const after = Date.now();
    const [row] = upsert.mock.calls[0] as [Record<string, unknown>];
    const paidAt = Date.parse(row.paid_at as string);
    expect(paidAt).toBeGreaterThanOrEqual(before);
    expect(paidAt).toBeLessThanOrEqual(after);
    expect(row.payer_email).toBeNull();
    expect(row.media_label).toBeNull();
  });

  it("returns ok:false and does not throw when Supabase reports an error", async () => {
    const upsert = vi.fn(async () => ({ error: { message: "fail" } as { message: string } }));
    const admin = {
      from: () => ({ upsert }),
    } as unknown as SupabaseClient;
    const r = await upsertFlowFinalizeRecord({
      admin,
      paymentId: PAYMENT_ID,
      snapshot: { flowOrder: 1, commerceOrder: "x", status: 2, amount: 1, currency: "CLP" },
    });
    expect(r.ok).toBe(false);
  });
});
