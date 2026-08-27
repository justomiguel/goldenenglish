import { describe, it, expect } from "vitest";
import { buildHomePageMetadata } from "@/lib/metadata/buildHomePageMetadata";

describe("buildHomePageMetadata", () => {
  it("uses an absolute title equal to the brand name", () => {
    const result = buildHomePageMetadata("Espacio Zenit");
    expect(result.title).toEqual({ absolute: "Espacio Zenit" });
  });

  it("does not put a pipe in the absolute title", () => {
    const result = buildHomePageMetadata("Golden English");
    const title = result.title;
    expect(title).toEqual({ absolute: "Golden English" });
    if (title && typeof title === "object" && "absolute" in title) {
      expect(String(title.absolute)).not.toContain("|");
    }
  });
});
