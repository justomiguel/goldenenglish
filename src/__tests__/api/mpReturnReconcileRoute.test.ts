/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolve = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: vi.fn(),
}));
vi.mock("@/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage", () => ({
  resolveMercadoPagoMonthlyPaymentReturnPage: (...args: unknown[]) => mockResolve(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

import { GET } from "@/app/api/payments/mercadopago/return-reconcile/route";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

describe("GET /api/payments/mercadopago/return-reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicSiteUrl).mockReturnValue(new URL("https://example.com"));
    mockResolve.mockResolvedValue({ outcome: "success" });
  });

  it("redirects to login when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    const res = await GET(
      new Request(
        "https://example.com/api/payments/mercadopago/return-reconcile?locale=en&dashboard=parent&payment_id=mp-1&country=CL",
      ),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/en/login");
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("finalizes then redirects to mp-return for parent", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { role: "parent" }, error: null }),
          }),
        }),
      }),
    });
    const res = await GET(
      new Request(
        "https://example.com/api/payments/mercadopago/return-reconcile?locale=en&dashboard=parent&payment_id=mp-1&external_reference=pay-1&status=approved&country=CL",
      ),
    );
    expect(res.status).toBe(303);
    expect(mockResolve).toHaveBeenCalledWith(
      expect.objectContaining({ allowFinalize: true, mpPaymentId: "mp-1" }),
    );
    expect(res.headers.get("location")).toBe(
      "https://example.com/en/dashboard/parent/payments/mp-return?status=approved&external_reference=pay-1&payment_id=mp-1&country=CL",
    );
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toMatch(/private/);
    expect(cc).not.toMatch(/\bpublic\b/);
  });
});
