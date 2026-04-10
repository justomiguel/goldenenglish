import { describe, it, expect } from "vitest";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";

describe("parentDefaultEmail", () => {
  it("uses parents subdomain", () => {
    expect(parentDefaultEmail("12.345.678")).toBe(
      "12345678@parents.goldenenglish.local",
    );
  });

  it("uses sin-doc placeholder when DNI strips to empty", () => {
    expect(parentDefaultEmail("@@@")).toBe("sin-doc@parents.goldenenglish.local");
  });
});
