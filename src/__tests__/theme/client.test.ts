import { describe, it, expect } from "vitest";
import { theme } from "@/lib/theme/client";

describe("theme (client tokens)", () => {
  it("references CSS variables for colors and fonts", () => {
    expect(theme.colors.primary.startsWith("var(--color")).toBe(true);
    expect(theme.fonts.primary.startsWith("var(--font")).toBe(true);
  });
});
