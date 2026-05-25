/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPaymentForReceipt } from "@/lib/billing/loadPaymentForReceipt";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/billing/loadBillingCurrencySetting", () => ({
  loadBillingCurrencySetting: vi.fn(),
}));

const paymentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const studentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const parentId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const sectionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const baseRow = {
  id: paymentId,
  parent_id: parentId,
  student_id: studentId,
  month: 5,
  year: 2026,
  amount: 50000,
  status: "approved",
  receipt_url: null,
  payment_kind: "monthly",
  section_id: sectionId,
  updated_at: "2026-05-10T12:00:00Z",
  created_at: "2026-05-09T12:00:00Z",
};

function sessionClient(row: unknown | null, error: unknown | null = null): SupabaseClient {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
    })),
  } as unknown as SupabaseClient;
}

const methodLabels = {
  flowMethodLabel: "Flow",
  mercadoPagoMethodLabel: "Mercado Pago",
  uploadMethodLabel: "Upload",
} as const;

function adminFromFactory(responders: Record<string, () => Promise<{ data: unknown; error: null }>>) {
  const withMpDefault = {
    payment_mp_finalize_records: async () => ({ data: null, error: null }),
    ...responders,
  };
  return {
    from: vi.fn((table: string) => {
      const run = withMpDefault[table];
      if (!run) throw new Error(`unexpected admin table ${table}`);
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(run),
      };
    }),
  };
}

describe("loadPaymentForReceipt", () => {
  beforeEach(() => {
    vi.mocked(loadBillingCurrencySetting).mockResolvedValue({ currency: "CLP" });
  });

  it("returns not_found when the session cannot read the payment", async () => {
    const out = await loadPaymentForReceipt({
      supabase: sessionClient(null, null),
      paymentId,
      ...methodLabels,
    });
    expect(out).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns not_found when Supabase returns an error object", async () => {
    const out = await loadPaymentForReceipt({
      supabase: sessionClient(null, { message: "rls" }),
      paymentId,
      ...methodLabels,
    });
    expect(out).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns not_paid when status is not approved", async () => {
    const out = await loadPaymentForReceipt({
      supabase: sessionClient({ ...baseRow, status: "pending" }),
      paymentId,
      ...methodLabels,
    });
    expect(out).toEqual({ ok: false, reason: "not_paid" });
  });

  it("returns ok for manual approval without Flow refs (receipt number from payment id)", async () => {
    let profileCalls = 0;
    vi.mocked(createAdminClient).mockReturnValue(
      adminFromFactory({
        profiles: async () => {
          profileCalls += 1;
          if (profileCalls === 1) {
            return { data: { first_name: "Tomás", last_name: "Pérez", email: "t@e.com" }, error: null };
          }
          return { data: { first_name: "Ana", last_name: "López", email: "a@e.com" }, error: null };
        },
        academic_sections: async () => ({ data: { name: "Inglés A1" }, error: null }),
        payment_flow_checkout_refs: async () => ({ data: null, error: null }),
        payment_flow_finalize_records: async () => ({ data: null, error: null }),
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const out = await loadPaymentForReceipt({
      supabase: sessionClient({ ...baseRow }),
      paymentId,
      flowMethodLabel: "Flow",
      mercadoPagoMethodLabel: "Mercado Pago",
      uploadMethodLabel: "Comprobante",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error("expected ok");
    expect(out.payment.methodLabel).toBe("Comprobante");
    expect(out.payment.receiptNumber).toMatch(/^REC-[A-F0-9]{12}$/);
    expect(out.payer.paidByTutor).toBe(true);
    expect(out.payer.email).toBe("a@e.com");
  });

  it("uses Flow checkout ref and finalize snapshot when present", async () => {
    let profileCalls = 0;
    vi.mocked(createAdminClient).mockReturnValue(
      adminFromFactory({
        profiles: async () => {
          profileCalls += 1;
          if (profileCalls === 1) {
            return { data: { first_name: "Tomás", last_name: "Pérez", email: "t@e.com" }, error: null };
          }
          return { data: null, error: null };
        },
        academic_sections: async () => ({ data: null, error: null }),
        payment_flow_checkout_refs: async () => ({
          data: { commerce_ref: "MES-PRE", created_at: "2026-05-09T10:00:00Z" },
          error: null,
        }),
        payment_flow_finalize_records: async () => ({
          data: {
            flow_order: 9,
            paid_at: "2026-05-10T15:00:00Z",
            payer_email: "flow-payer@e.com",
            media_label: "Webpay",
            commerce_order: "ORD-99",
            currency: "CLP",
            amount: 49000,
          },
          error: null,
        }),
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const out = await loadPaymentForReceipt({
      supabase: sessionClient({
        ...baseRow,
        parent_id: null,
        amount: 50000,
      }),
      paymentId,
      flowMethodLabel: "Flow",
      mercadoPagoMethodLabel: "Mercado Pago",
      uploadMethodLabel: "Comprobante",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error("expected ok");
    expect(out.payment.receiptNumber).toBe("ORD-99");
    expect(out.payment.amount).toBe(49000);
    expect(out.payment.paidAt).toBe("2026-05-10T15:00:00Z");
    expect(out.payment.currency).toBe("CLP");
    expect(out.payment.methodLabel).toContain("Flow");
    expect(out.payment.methodLabel).toContain("Webpay");
    expect(out.payment.methodLabel).toContain("9");
    expect(out.payer.paidByTutor).toBe(false);
    expect(out.payer.email).toBe("flow-payer@e.com");
  });

  it("treats payment_kind enrollment and uses checkout ref when finalize is absent", async () => {
    let profileCalls = 0;
    vi.mocked(createAdminClient).mockReturnValue(
      adminFromFactory({
        profiles: async () => {
          profileCalls += 1;
          return {
            data:
              profileCalls === 1
                ? { first_name: "X", last_name: "Y", email: "x@y.z" }
                : null,
            error: null,
          };
        },
        academic_sections: async () => ({ data: null, error: null }),
        payment_flow_checkout_refs: async () => ({
          data: { commerce_ref: "CHK-ONLY", created_at: "2026-05-09T10:00:00Z" },
          error: null,
        }),
        payment_flow_finalize_records: async () => ({ data: null, error: null }),
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const out = await loadPaymentForReceipt({
      supabase: sessionClient({
        ...baseRow,
        parent_id: null,
        section_id: null,
        payment_kind: "enrollment",
      }),
      paymentId,
      flowMethodLabel: "Flow",
      mercadoPagoMethodLabel: "Mercado Pago",
      uploadMethodLabel: "Upload",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error("expected ok");
    expect(out.payment.paymentKind).toBe("enrollment");
    expect(out.payment.receiptNumber).toBe("CHK-ONLY");
    expect(out.payment.methodLabel).toContain("Flow");
  });

  it("composes Flow method label with order only when media label is absent", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      adminFromFactory({
        profiles: async () => ({
          data: { first_name: "A", last_name: "B", email: "a@b.c" },
          error: null,
        }),
        academic_sections: async () => ({ data: null, error: null }),
        payment_flow_checkout_refs: async () => ({ data: null, error: null }),
        payment_flow_finalize_records: async () => ({
          data: {
            flow_order: 3,
            paid_at: "2026-05-10T12:00:00Z",
            payer_email: null,
            media_label: null,
            commerce_order: "O-1",
            currency: "CLP",
            amount: 1000,
          },
          error: null,
        }),
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const out = await loadPaymentForReceipt({
      supabase: sessionClient({ ...baseRow, parent_id: null }),
      paymentId,
      flowMethodLabel: "Flow",
      mercadoPagoMethodLabel: "Mercado Pago",
      uploadMethodLabel: "Up",
    });

    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error("expected ok");
    expect(out.payment.methodLabel).toBe("Flow · Nº 3");
  });

  it("uses MercadoPago finalize snapshot when gateway_provider is mercadopago", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      adminFromFactory({
        profiles: async () => ({
          data: { first_name: "Tomás", last_name: "Pérez", email: "t@e.com" },
          error: null,
        }),
        academic_sections: async () => ({ data: { name: "Inglés B2" }, error: null }),
        payment_flow_checkout_refs: async () => ({ data: null, error: null }),
        payment_flow_finalize_records: async () => ({ data: null, error: null }),
        payment_mp_finalize_records: async () => ({
          data: {
            mp_payment_id: 987654321,
            paid_at: "2026-05-11T09:00:00Z",
            payer_email: "mp-payer@e.com",
            payment_method: "credit_card",
            currency: "CLP",
            amount: 50000,
          },
          error: null,
        }),
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const out = await loadPaymentForReceipt({
      supabase: sessionClient({
        ...baseRow,
        parent_id: null,
        gateway_provider: "mercadopago",
      }),
      paymentId,
      ...methodLabels,
    });

    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error("expected ok");
    expect(out.payment.receiptNumber).toBe("MP-987654321");
    expect(out.payment.methodLabel).toBe("Mercado Pago · credit_card");
    expect(out.payer.email).toBe("mp-payer@e.com");
  });
});
