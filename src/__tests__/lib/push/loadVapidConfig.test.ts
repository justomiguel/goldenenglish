import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getVapidPublicKey, loadVapidConfig } from "@/lib/push/loadVapidConfig";

describe("loadVapidConfig", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("returns null when keys missing", () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_CONTACT_EMAIL;
    expect(loadVapidConfig()).toBeNull();
  });

  it("returns config when env is complete", () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = " pub ";
    process.env.VAPID_PRIVATE_KEY = " priv ";
    process.env.VAPID_CONTACT_EMAIL = " ops@test.com ";
    expect(loadVapidConfig()).toEqual({
      publicKey: "pub",
      privateKey: "priv",
      contactEmail: "ops@test.com",
    });
  });

  it("getVapidPublicKey returns trimmed key or null", () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "  abc  ";
    expect(getVapidPublicKey()).toBe("abc");
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    expect(getVapidPublicKey()).toBeNull();
  });
});
