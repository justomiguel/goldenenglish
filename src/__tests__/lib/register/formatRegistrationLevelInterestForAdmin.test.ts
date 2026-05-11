import { describe, it, expect } from "vitest";
import { REGISTRATION_LEVEL_INTEREST_UNDECIDED } from "@/lib/register/registrationSectionConstants";
import { formatRegistrationLevelInterestForAdmin } from "@/lib/register/formatRegistrationLevelInterestForAdmin";

const labels = { levelInterestUndecided: "(undecided)", emptyValue: "—" };

describe("formatRegistrationLevelInterestForAdmin", () => {
  it("maps undecided sentinel to label", () => {
    expect(formatRegistrationLevelInterestForAdmin(REGISTRATION_LEVEL_INTEREST_UNDECIDED, labels)).toBe(
      "(undecided)",
    );
  });

  it("returns trimmed interest string", () => {
    expect(formatRegistrationLevelInterestForAdmin("  B1  ", labels)).toBe("B1");
  });

  it("returns empty placeholder for null/blank", () => {
    expect(formatRegistrationLevelInterestForAdmin(null, labels)).toBe("—");
    expect(formatRegistrationLevelInterestForAdmin("  ", labels)).toBe("—");
  });
});
