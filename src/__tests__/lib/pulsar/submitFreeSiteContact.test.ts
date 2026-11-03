import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import { submitFreeSiteContact } from "@/lib/pulsar/submitFreeSiteContact";

const { send, reserve, isPulsar } = vi.hoisted(() => ({
  send: vi.fn(),
  reserve: vi.fn(),
  isPulsar: vi.fn(),
}));

vi.mock("@/lib/tenant/tenantRequestContext", () => ({
  isPulsarPlatformRequest: isPulsar,
}));

vi.mock("@/lib/tenant/alsTenantAccessor", () => ({
  getAlsTenant: () => ({ slug: "club" }),
}));

vi.mock("@/lib/pulsar/freeContactMail", () => ({
  reserveFreeContactMail: reserve,
  releaseFreeContactMail: vi.fn(),
  loadFreeSiteOwnerEmail: vi.fn(),
}));

vi.mock("@/lib/pulsar/pulsarMail", () => ({
  sendPulsarMail: send,
}));

const payload = {
  locale: "es",
  name: "Ana",
  email: "ana@example.com",
  phone: "",
  message: "Quiero una clase",
};

beforeEach(() => {
  send.mockReset();
  reserve.mockReset();
  isPulsar.mockReset();
});

describe("submitFreeSiteContact", () => {
  it("does not send from the preview route", async () => {
    isPulsar.mockResolvedValue(true);
    const result = await submitFreeSiteContact(payload);
    expect(result).toEqual({ ok: false, errorCode: "preview" });
    expect(send).not.toHaveBeenCalled();
    expect(reserve).not.toHaveBeenCalled();
  });

  it("does not send when the reserve returns the quota", async () => {
    isPulsar.mockResolvedValue(false);
    reserve.mockResolvedValue("quota");
    const result = await submitFreeSiteContact(payload);
    expect(result).toEqual({ ok: false, errorCode: "quota" });
    expect(send).not.toHaveBeenCalled();
  });
});
