// REGRESSION CHECK: Field parsing gates all admin inline profile updates; invalid email/phone/DNI must stay server-rejected.
import { describe, it, expect } from "vitest";
import { parseAdminUserDetailField } from "@/lib/dashboard/adminUserDetailUpdateParse";

describe("parseAdminUserDetailField", () => {
  it("rejects empty email", () => {
    expect(parseAdminUserDetailField("email", "  ")).toEqual({ ok: false, code: "email_required" });
  });

  it("rejects invalid email", () => {
    expect(parseAdminUserDetailField("email", "not")).toEqual({ ok: false, code: "email_invalid" });
  });

  it("normalizes valid email", () => {
    expect(parseAdminUserDetailField("email", "  A@B.COM ")).toEqual({ ok: true, normalized: "a@b.com" });
  });

  it("allows empty phone as null", () => {
    expect(parseAdminUserDetailField("phone", "")).toEqual({ ok: true, normalized: null });
  });

  it("rejects phone that is too long", () => {
    const long = "0".repeat(41);
    expect(parseAdminUserDetailField("phone", long)).toEqual({ ok: false, code: "phone_too_long" });
  });

  it("requires dni", () => {
    expect(parseAdminUserDetailField("dniOrPassport", "  ")).toEqual({ ok: false, code: "dni_required" });
  });

  it("clears birth date with empty string", () => {
    expect(parseAdminUserDetailField("birthDate", "")).toEqual({ ok: true, normalized: null });
  });

  it("rejects invalid birth date", () => {
    expect(parseAdminUserDetailField("birthDate", "99-99-99")).toEqual({ ok: false, code: "birth_invalid" });
  });
});
