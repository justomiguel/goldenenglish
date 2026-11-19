import { describe, expect, it } from "vitest";
import { fillTourTemplate } from "@/lib/admin-tutorials/fillTourTemplate";

describe("fillTourTemplate", () => {
  it("replaces a known token and clears a missing one", () => {
    expect(fillTourTemplate("Año {{year}} {{missing}}", { year: "2026" })).toBe("Año 2026 ");
  });
});
