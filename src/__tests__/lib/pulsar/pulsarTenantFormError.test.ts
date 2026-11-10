import { describe, expect, it } from "vitest";
import { pulsarTenantFormErrorText } from "@/lib/pulsar/pulsarTenantFormError";

const errors = {
  invalid_slug: "Enter a valid lowercase slug (do not use pulsar).",
  operator_admin_failed:
    "The operator admin account was not created. Check the server log and try again. Code: operator_admin_failed",
};

describe("pulsarTenantFormErrorText", () => {
  it("shows the validation sentence for invalid_slug", () => {
    expect(pulsarTenantFormErrorText("invalid_slug", errors)).toBe(errors.invalid_slug);
  });

  it("shows the operator admin sentence and keeps the code in the text", () => {
    const text = pulsarTenantFormErrorText("operator_admin_failed", errors);
    expect(text).toContain("operator admin");
    expect(text).toContain("operator_admin_failed");
  });

  it("shows an unknown code as itself", () => {
    expect(pulsarTenantFormErrorText("mystery_code", errors)).toBe("mystery_code");
  });
});
