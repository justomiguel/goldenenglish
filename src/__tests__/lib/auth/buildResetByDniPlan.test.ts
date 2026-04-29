import { describe, it, expect } from "vitest";
import { buildResetByDniPlan } from "@/lib/auth/buildResetByDniPlan";

describe("buildResetByDniPlan", () => {
  it("derives password = DNI when DNI is at least 6 chars", () => {
    const plan = buildResetByDniPlan({
      dni: "12345678",
      currentEmail: "user@example.com",
    });
    expect(plan.generatedPassword).toBe("12345678");
  });

  it("right-pads DNI with zeros up to 6 chars when shorter", () => {
    const plan = buildResetByDniPlan({
      dni: "1234",
      currentEmail: "user@example.com",
    });
    expect(plan.generatedPassword).toBe("123400");
  });

  it("strips dots and whitespace from the DNI before deriving the password", () => {
    const plan = buildResetByDniPlan({
      dni: " 12.345.678 ",
      currentEmail: null,
    });
    expect(plan.generatedPassword).toBe("12345678");
  });

  it("flags hasRealEmail=true for a real email address", () => {
    const plan = buildResetByDniPlan({
      dni: "12345678",
      currentEmail: "real@example.com",
    });
    expect(plan.hasRealEmail).toBe(true);
  });

  it("flags hasRealEmail=false for a synthetic student domain (case-insensitive)", () => {
    const plan = buildResetByDniPlan({
      dni: "12345678",
      currentEmail: "12345678@students.goldenenglish.local",
    });
    expect(plan.hasRealEmail).toBe(false);

    const upper = buildResetByDniPlan({
      dni: "12345678",
      currentEmail: "12345678@STUDENTS.GOLDENENGLISH.LOCAL",
    });
    expect(upper.hasRealEmail).toBe(false);
  });

  it("flags hasRealEmail=false for a synthetic parent domain", () => {
    const plan = buildResetByDniPlan({
      dni: "99999999",
      currentEmail: "99999999@parents.goldenenglish.local",
    });
    expect(plan.hasRealEmail).toBe(false);
  });

  it("flags hasRealEmail=false when currentEmail is null, undefined, or whitespace", () => {
    expect(
      buildResetByDniPlan({ dni: "12345678", currentEmail: null }).hasRealEmail,
    ).toBe(false);
    expect(
      buildResetByDniPlan({ dni: "12345678", currentEmail: undefined })
        .hasRealEmail,
    ).toBe(false);
    expect(
      buildResetByDniPlan({ dni: "12345678", currentEmail: "   " })
        .hasRealEmail,
    ).toBe(false);
  });

  it("trims whitespace around currentEmail before checking the domain", () => {
    const plan = buildResetByDniPlan({
      dni: "12345678",
      currentEmail: "  real@example.com  ",
    });
    expect(plan.hasRealEmail).toBe(true);
  });
});
