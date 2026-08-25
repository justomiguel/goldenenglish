import { describe, expect, it } from "vitest";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";

describe("requestedRegistrationSectionIds", () => {
  it("puts preferred first and dedupes extras", () => {
    expect(
      requestedRegistrationSectionIds({
        preferred_section_id: "a",
        additionalSectionIds: ["b", "a", "c"],
      }),
    ).toEqual(["a", "b", "c"]);
  });

  it("returns extras only when preferred is empty", () => {
    expect(
      requestedRegistrationSectionIds({
        preferred_section_id: null,
        additionalSectionIds: ["b"],
      }),
    ).toEqual(["b"]);
  });
});
