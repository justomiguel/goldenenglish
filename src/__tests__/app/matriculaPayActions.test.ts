/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  upload: vi.fn(),
  switchSection: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  createAdminClient: vi.fn(() => ({})),
  loadKey: vi.fn(() => Buffer.alloc(32)),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: mocks.loadKey,
}));
vi.mock("@/lib/register/startRegistrationEnrollmentGatewayCore", () => ({
  startRegistrationEnrollmentGatewayCore: mocks.start,
}));
vi.mock("@/lib/register/uploadRegistrationEnrollmentReceiptCore", () => ({
  uploadRegistrationEnrollmentReceiptCore: mocks.upload,
}));
vi.mock("@/lib/register/switchRegistrationPaySectionCore", () => ({
  switchRegistrationPaySectionCore: mocks.switchSection,
}));

import {
  startRegistrationEnrollmentFlowAction,
  uploadRegistrationEnrollmentReceiptAction,
} from "@/app/[locale]/matricula/matriculaPayActions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("matriculaPayActions", () => {
  it("redirects to the Flow checkout URL", async () => {
    mocks.start.mockResolvedValue({ ok: true, redirectUrl: "https://flow.test/pay" });
    await expect(startRegistrationEnrollmentFlowAction("es", "tok")).rejects.toThrow(
      "REDIRECT:https://flow.test/pay",
    );
    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({ method: "flow", payToken: "tok", locale: "es" }),
    );
  });

  it("returns section_full without redirecting", async () => {
    mocks.start.mockResolvedValue({ ok: false, code: "section_full" });
    await expect(startRegistrationEnrollmentFlowAction("es", "tok")).resolves.toEqual({
      ok: false,
      code: "section_full",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("revalidates the pay page after a receipt upload", async () => {
    mocks.upload.mockResolvedValue({ ok: true });
    const form = new FormData();
    form.set("token", "tok");
    form.set("locale", "es");
    form.set("sectionLabel", "A2");
    form.set("receipt", new File(["%PDF"], "ok.pdf", { type: "application/pdf" }));
    await expect(uploadRegistrationEnrollmentReceiptAction(form)).resolves.toEqual({
      ok: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/es/matricula/tok");
  });
});
