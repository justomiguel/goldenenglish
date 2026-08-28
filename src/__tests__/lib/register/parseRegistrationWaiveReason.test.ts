/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseRegistrationWaiveReason } from "@/lib/register/parseRegistrationWaiveReason";

describe("parseRegistrationWaiveReason", () => {
  it("requires a short visible reason", () => {
    expect(parseRegistrationWaiveReason("")).toBeNull();
    expect(parseRegistrationWaiveReason("   ")).toBeNull();
    expect(parseRegistrationWaiveReason("ok")).toBe("ok");
    expect(parseRegistrationWaiveReason("  beca  ")).toBe("beca");
  });
});
