import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRunCheckout = vi.fn();
vi.mock("@/lib/payments/runMercadoPagoMonthlyCheckout", () => ({
  runMercadoPagoMonthlyCheckout: (...args: unknown[]) => mockRunCheckout(...args),
}));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/profile/getProfilePermissions", () => ({
  getProfilePermissions: vi.fn(async () => ({ canAccessPaymentsModule: true })),
}));

vi.mock("@/lib/i18n/actionErrors", () => ({
  paymentActionDict: vi.fn(async () => ({
    invalidForm: "invalid form",
    invalidAmount: "invalid amount",
    unauthorized: "unauthorized",
    forbidden: "forbidden",
  })),
  localeFromFormData: () => "en",
}));

import { startStudentMercadoPagoMonthlyPayment } from "@/app/[locale]/dashboard/student/payments/mercadoPagoMonthlyPaymentActions";

function form(over: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("locale", "en");
  fd.set("month", over.month ?? "5");
  fd.set("year", over.year ?? "2026");
  fd.set("amount", over.amount ?? "50000");
  fd.set("sectionId", over.sectionId ?? "sec-1");
  return fd;
}

describe("startStudentMercadoPagoMonthlyPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: mockProfileSingle,
          }),
        }),
      }),
    });
  });

  it("returns unauthorized when there is no session email", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await startStudentMercadoPagoMonthlyPayment(form());

    expect(result).toEqual({ ok: false, message: "unauthorized" });
    expect(mockRunCheckout).not.toHaveBeenCalled();
  });

  it("returns forbidden when profile role is not student", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "s@e.com" } },
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });

    const result = await startStudentMercadoPagoMonthlyPayment(form());

    expect(result).toEqual({ ok: false, message: "forbidden" });
  });

  it("delegates to runMercadoPagoMonthlyCheckout for valid student session", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "s@e.com" } },
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });
    mockRunCheckout.mockResolvedValue({ ok: true, redirectUrl: "https://mp/redirect" });

    const result = await startStudentMercadoPagoMonthlyPayment(form());

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp/redirect" });
    expect(mockRunCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "u1",
        payerEmail: "s@e.com",
        sectionId: "sec-1",
      }),
    );
  });
});
