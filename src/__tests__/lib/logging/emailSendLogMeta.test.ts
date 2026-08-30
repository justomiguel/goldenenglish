import { describe, expect, it } from "vitest";
import { emailSendLogMeta } from "@/lib/logging/emailSendLogMeta";

describe("emailSendLogMeta", () => {
  it("keeps template, locale, domain and var keys — never the mailbox", () => {
    const meta = emailSendLogMeta({
      to: "Ana.Garcia@Institute.example",
      templateKey: "registration.admin_received",
      locale: "es",
      vars: { studentName: "Ana Garcia", payUrl: "https://secret.example/pay" },
    });

    expect(meta).toEqual({
      templateKey: "registration.admin_received",
      locale: "es",
      toDomain: "institute.example",
      toSynthetic: false,
      varKeys: ["studentName", "payUrl"],
    });
    expect(JSON.stringify(meta)).not.toContain("Ana");
    expect(JSON.stringify(meta)).not.toContain("ana.garcia");
    expect(JSON.stringify(meta)).not.toContain("https://secret.example/pay");
  });

  it("flags synthetic tenant mailboxes", () => {
    const meta = emailSendLogMeta({
      to: "juan@students.goldenenglish.local",
      templateKey: "registration.welcome",
      locale: "en",
    });
    expect(meta.toSynthetic).toBe(true);
    expect(meta.toDomain).toBe("students.goldenenglish.local");
    expect(meta.varKeys).toEqual([]);
  });
});
