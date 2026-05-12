import { describe, it, expect, vi } from "vitest";
import { loadSectionCollectionsPaymentHistoryPage } from "@/lib/billing/loadSectionCollectionsPaymentHistoryPage";

vi.mock("@/lib/payments/receiptSignedUrl", () => ({
  receiptSignedUrlForAdmin: vi.fn(async () => "https://signed.example/receipt"),
}));

describe("loadSectionCollectionsPaymentHistoryPage", () => {
  it("returns bounded page and total count", async () => {
    const paymentRow = {
      id: "pay-1",
      student_id: "stu-1",
      month: 3,
      year: 2026,
      amount: 100,
      status: "approved",
      receipt_url: null,
      admin_notes: null,
      updated_at: "2026-03-01T12:00:00.000Z",
    };

    const payApi = {
      select(_cols: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.head) {
          return {
            eq: () => Promise.resolve({ count: 1, error: null }),
          };
        }
        return {
          eq: () => ({
            order: () => ({
              range: () => Promise.resolve({ data: [paymentRow], error: null }),
            }),
          }),
        };
      },
    };

    const profApi = {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ id: "stu-1", first_name: "Ann", last_name: "Bee" }],
            error: null,
          }),
      }),
    };

    /** Flow finalize record is not present for the legacy upload-only payment in this fixture. */
    const flowApi = {
      select: () => ({
        in: () => Promise.resolve({ data: [], error: null }),
      }),
    };

    const client = {
      from(table: string) {
        if (table === "payments") return payApi;
        if (table === "profiles") return profApi;
        if (table === "payment_flow_finalize_records") return flowApi;
        return {};
      },
    };

    const r = await loadSectionCollectionsPaymentHistoryPage(client as never, "sec-id", {
      page: 1,
      pageSize: 20,
    });

    expect(r.total).toBe(1);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].studentId).toBe("stu-1");
    expect(r.rows[0].year).toBe(2026);
    expect(r.rows[0].month).toBe(3);
    /** Without finalize record, flowFinalize must be null so the modal trigger does not render. */
    expect(r.rows[0].flowFinalize).toBeNull();
  });

  it("attaches flowFinalize summary when payment_flow_finalize_records has a row", async () => {
    const paymentRow = {
      id: "pay-2",
      student_id: "stu-1",
      month: 4,
      year: 2026,
      amount: 12500,
      status: "approved",
      receipt_url: null,
      admin_notes: null,
      updated_at: "2026-04-01T12:00:00.000Z",
    };

    const payApi = {
      select(_cols: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.head) {
          return { eq: () => Promise.resolve({ count: 1, error: null }) };
        }
        return {
          eq: () => ({
            order: () => ({
              range: () => Promise.resolve({ data: [paymentRow], error: null }),
            }),
          }),
        };
      },
    };

    const profApi = {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ id: "stu-1", first_name: "Ana", last_name: "Pérez" }],
            error: null,
          }),
      }),
    };

    const flowApi = {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [
              {
                payment_id: "pay-2",
                flow_order: 999,
                commerce_order: "MES-2026-04-00000007",
                currency: "CLP",
                amount: 12500,
                paid_at: "2026-04-01T12:00:00.000Z",
                payer_email: "p@example.com",
                media_label: "Webpay",
                fee: 380,
                balance: 12120,
                transfer_date: "2026-04-03T00:00:00.000Z",
                conversion_rate: null,
                conversion_date: null,
              },
            ],
            error: null,
          }),
      }),
    };

    const client = {
      from(table: string) {
        if (table === "payments") return payApi;
        if (table === "profiles") return profApi;
        if (table === "payment_flow_finalize_records") return flowApi;
        return {};
      },
    };

    const { rows } = await loadSectionCollectionsPaymentHistoryPage(client as never, "sec-id", {
      page: 1,
      pageSize: 20,
    });

    expect(rows[0].flowFinalize).not.toBeNull();
    expect(rows[0].flowFinalize).toMatchObject({
      flowOrder: 999,
      commerceOrder: "MES-2026-04-00000007",
      currency: "CLP",
      amount: 12500,
      payerEmail: "p@example.com",
      mediaLabel: "Webpay",
      fee: 380,
      balance: 12120,
    });
    expect(rows[0].flowFinalize?.transferDate).toBe("2026-04-03T00:00:00.000Z");
  });
});
