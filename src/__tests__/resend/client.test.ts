import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ResendCtor = vi.hoisted(() =>
  vi.fn(function Resend(this: unknown, key: string | undefined) {
    return { key };
  }),
);

vi.mock("resend", () => ({
  Resend: ResendCtor,
}));

describe("resend client", () => {
  const prev = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    ResendCtor.mockClear();
    process.env.RESEND_API_KEY = "re_test_key";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = prev;
  });

  it("instantiates Resend with RESEND_API_KEY", async () => {
    const mod = await import("@/lib/resend/client");
    expect(ResendCtor).toHaveBeenCalledWith("re_test_key");
    expect(mod.resend).toEqual({ key: "re_test_key" });
  });
});
