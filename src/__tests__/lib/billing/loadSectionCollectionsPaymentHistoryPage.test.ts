import { describe, it, expect, vi } from "vitest";
import { loadSectionCollectionsPaymentHistoryPage } from "@/lib/billing/loadSectionCollectionsPaymentHistoryPage";

vi.mock("@/lib/payments/receiptSignedUrl", () => ({
  receiptSignedUrlForAdmin: vi.fn(async (_url: string) => "https://signed.example/receipt"),
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

    const client = {
      from(table: string) {
        if (table === "payments") return payApi;
        if (table === "profiles") return profApi;
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
  });
});
