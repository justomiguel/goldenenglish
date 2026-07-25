/** @vitest-environment node */
// REGRESSION CHECK: e2e / EMAIL_PROVIDER=recording must never return ResendEmailProvider.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ResendEmailProvider } from "@/lib/email/resendEmailProvider";
import { RecordingEmailProvider } from "@/lib/email/recordingEmailProvider";
import { shouldUseRecordingEmailProvider } from "@/lib/email/shouldUseRecordingEmailProvider";

describe("shouldUseRecordingEmailProvider", () => {
  it("is true when GE_DEV_TARGET is e2e", () => {
    expect(shouldUseRecordingEmailProvider({ GE_DEV_TARGET: "e2e" })).toBe(true);
  });

  it("is true when EMAIL_PROVIDER is recording", () => {
    expect(shouldUseRecordingEmailProvider({ EMAIL_PROVIDER: "recording" })).toBe(
      true,
    );
  });

  it("is false for tenant targets without recording flag", () => {
    expect(
      shouldUseRecordingEmailProvider({
        GE_DEV_TARGET: "nago",
        EMAIL_PROVIDER: "resend",
      }),
    ).toBe(false);
  });
});

describe("getEmailProvider", () => {
  const prevTarget = process.env.GE_DEV_TARGET;
  const prevProvider = process.env.EMAIL_PROVIDER;

  beforeEach(() => {
    delete process.env.GE_DEV_TARGET;
    delete process.env.EMAIL_PROVIDER;
  });

  afterEach(() => {
    if (prevTarget === undefined) delete process.env.GE_DEV_TARGET;
    else process.env.GE_DEV_TARGET = prevTarget;
    if (prevProvider === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = prevProvider;
  });

  it("returns ResendEmailProvider by default", async () => {
    const { getEmailProvider } = await import("@/lib/email/getEmailProvider");
    const p = getEmailProvider();
    expect(p).toBeInstanceOf(ResendEmailProvider);
  });

  it("returns RecordingEmailProvider when GE_DEV_TARGET=e2e", async () => {
    process.env.GE_DEV_TARGET = "e2e";
    const { getEmailProvider } = await import("@/lib/email/getEmailProvider");
    const p = getEmailProvider();
    expect(p).toBeInstanceOf(RecordingEmailProvider);
  });

  it("returns RecordingEmailProvider when EMAIL_PROVIDER=recording", async () => {
    process.env.EMAIL_PROVIDER = "recording";
    const { getEmailProvider } = await import("@/lib/email/getEmailProvider");
    const p = getEmailProvider();
    expect(p).toBeInstanceOf(RecordingEmailProvider);
  });
});
