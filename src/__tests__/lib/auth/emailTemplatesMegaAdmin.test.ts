import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL,
  isEmailTemplatesMegaAdmin,
} from "@/lib/auth/emailTemplatesMegaAdmin";

describe("isEmailTemplatesMegaAdmin", () => {
  it("matches allowlisted email case-insensitively with trim", () => {
    expect(isEmailTemplatesMegaAdmin(EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL)).toBe(true);
    expect(isEmailTemplatesMegaAdmin("  JUSTOMIGUELVARGAS@gmail.com  ")).toBe(true);
  });

  it("rejects other admins", () => {
    expect(isEmailTemplatesMegaAdmin("other@gmail.com")).toBe(false);
    expect(isEmailTemplatesMegaAdmin(null)).toBe(false);
    expect(isEmailTemplatesMegaAdmin(undefined)).toBe(false);
    expect(isEmailTemplatesMegaAdmin("")).toBe(false);
  });
});
