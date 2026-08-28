/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isDeliverableAuthEmail,
  isSyntheticAuthEmail,
} from "@/lib/auth/isSyntheticAuthEmail";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isSyntheticAuthEmail", () => {
  it("flags the legacy Golden student mailbox", () => {
    expect(isSyntheticAuthEmail("12345678@students.goldenenglish.local")).toBe(true);
    expect(isSyntheticAuthEmail("12345678@STUDENTS.GOLDENENGLISH.LOCAL")).toBe(true);
  });

  it("flags parent synthetics (legacy and parents.<tenant>)", () => {
    expect(isSyntheticAuthEmail("999@parents.goldenenglish.local")).toBe(true);
    expect(isSyntheticAuthEmail("123@parents.alumnos.nago.cl")).toBe(true);
  });

  it("flags MAIL_TENANT student synthetics", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    expect(isSyntheticAuthEmail("anagarcia-123456789@alumnos.test")).toBe(true);
  });

  it("does not flag a real mailbox when MAIL_TENANT is set", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    expect(isSyntheticAuthEmail("tutor@gmail.com")).toBe(false);
  });
});

describe("isDeliverableAuthEmail", () => {
  it("is true only for a non-empty real mailbox", () => {
    expect(isDeliverableAuthEmail("family@example.com")).toBe(true);
    expect(isDeliverableAuthEmail("  family@example.com  ")).toBe(true);
    expect(isDeliverableAuthEmail("")).toBe(false);
    expect(isDeliverableAuthEmail(null)).toBe(false);
    expect(isDeliverableAuthEmail("123@students.goldenenglish.local")).toBe(false);
  });
});
