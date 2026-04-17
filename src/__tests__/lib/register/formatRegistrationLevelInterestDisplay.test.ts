import { describe, it, expect } from "vitest";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import { REGISTRATION_LEVEL_INTEREST_UNDECIDED } from "@/lib/register/registrationSectionConstants";

const labels = { emptyValue: "—", levelInterestUndecided: "Undecided (staff)" };

describe("formatRegistrationLevelInterestDisplay", () => {
  it("maps stable undecided code to label", () => {
    expect(formatRegistrationLevelInterestDisplay(labels, REGISTRATION_LEVEL_INTEREST_UNDECIDED)).toBe(
      "Undecided (staff)",
    );
  });

  it("passes through other strings", () => {
    expect(formatRegistrationLevelInterestDisplay(labels, "B1 — Morning")).toBe("B1 — Morning");
  });

  it("empty to emptyValue", () => {
    expect(formatRegistrationLevelInterestDisplay(labels, null)).toBe("—");
  });
});
