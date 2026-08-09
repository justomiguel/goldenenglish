import { describe, expect, it } from "vitest";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

describe("registrationIsActionable", () => {
  it("allows new and contacted leads to be edited and accepted", () => {
    expect(registrationIsActionable("new")).toBe(true);
    expect(registrationIsActionable("contacted")).toBe(true);
  });

  it("blocks leads that are already enrolled or unknown", () => {
    expect(registrationIsActionable("enrolled")).toBe(false);
    expect(registrationIsActionable("")).toBe(false);
    expect(registrationIsActionable("something-else")).toBe(false);
  });
});
