import { describe, expect, it } from "vitest";
import { isValidE164Phone } from "@/lib/notifications/validateE164Phone";

describe("isValidE164Phone", () => {
  it("accepts plausible E.164", () => {
    expect(isValidE164Phone("+5491112345678")).toBe(true);
  });

  it("rejects missing plus or too short", () => {
    expect(isValidE164Phone("549111")).toBe(false);
    expect(isValidE164Phone("+123")).toBe(false);
    expect(isValidE164Phone("")).toBe(false);
  });
});
