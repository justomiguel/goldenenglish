/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";

describe("resolveRegistrationFamilyEmail", () => {
  it("uses the tutor email for a minor", () => {
    expect(
      resolveRegistrationFamilyEmail({
        isMinor: true,
        tutorEmail: "papa@example.com",
        studentEmail: "kid@tenant.invalid",
        studentEmailIsSynthetic: true,
      }),
    ).toBe("papa@example.com");
  });

  it("skips a synthetic student mailbox", () => {
    expect(
      resolveRegistrationFamilyEmail({
        isMinor: true,
        tutorEmail: null,
        studentEmail: "kid@tenant.invalid",
        studentEmailIsSynthetic: true,
      }),
    ).toBeNull();
  });

  it("uses the adult student email", () => {
    expect(
      resolveRegistrationFamilyEmail({
        isMinor: false,
        tutorEmail: "ignored@example.com",
        studentEmail: "adulto@example.com",
        studentEmailIsSynthetic: false,
      }),
    ).toBe("adulto@example.com");
  });

  it("trims and lowercases", () => {
    expect(
      resolveRegistrationFamilyEmail({
        isMinor: false,
        tutorEmail: null,
        studentEmail: "  Adulto@Example.com  ",
        studentEmailIsSynthetic: false,
      }),
    ).toBe("adulto@example.com");
  });
});
