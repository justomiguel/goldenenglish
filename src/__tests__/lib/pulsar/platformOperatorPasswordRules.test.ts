import { describe, expect, it } from "vitest";
import {
  operatorPasswordFormError,
  parseOperatorPassword,
  type OperatorPasswordCopy,
} from "@/lib/pulsar/platformOperatorPasswordRules";

const copy: OperatorPasswordCopy = {
  empty: "Type a password. Code: operator_password_empty",
  short: "Use at least 8 characters. Code: operator_password_short",
  long: "Use at most 200 characters. Code: operator_password_long",
  saveFailed: "The password was not saved. Code: operator_password_save_failed",
  loginFailed: "The current login was not updated. Code: operator_password_login_failed",
  unauthorized: "Sign in again. Code: unauthorized",
  notConfigured: "The database is not configured. Code: not_configured",
};

// REGRESSION CHECK: Each password failure keeps its own sentence. An unknown code stays visible.

describe("parseOperatorPassword", () => {
  it("rejects an empty password", () => {
    expect(parseOperatorPassword("   ")).toEqual({ ok: false, errorCode: "operator_password_empty" });
  });

  it("rejects a short password", () => {
    expect(parseOperatorPassword("short")).toEqual({ ok: false, errorCode: "operator_password_short" });
  });

  it("trims a valid password", () => {
    expect(parseOperatorPassword("  long-enough  ")).toEqual({ ok: true, password: "long-enough" });
  });
});

describe("operatorPasswordFormError", () => {
  it("shows the sentence for a known code", () => {
    expect(operatorPasswordFormError("operator_password_short", copy)).toContain("operator_password_short");
  });

  it("shows a business failure code", () => {
    expect(operatorPasswordFormError("operator_password_login_failed", copy)).toContain(
      "operator_password_login_failed",
    );
  });

  it("shows an unknown code as itself", () => {
    expect(operatorPasswordFormError("mystery_code", copy)).toBe("mystery_code");
  });
});
