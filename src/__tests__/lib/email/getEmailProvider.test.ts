/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { ResendEmailProvider } from "@/lib/email/resendEmailProvider";

describe("getEmailProvider", () => {
  it("returns a ResendEmailProvider instance", () => {
    const p = getEmailProvider();
    expect(p).toBeInstanceOf(ResendEmailProvider);
    expect(typeof p.sendEmail).toBe("function");
  });
});
