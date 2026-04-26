import { describe, expect, it } from "vitest";
import { parseAcademicSectionShellTabParam } from "@/lib/academics/academicSectionShellTabOrder";

describe("parseAcademicSectionShellTabParam", () => {
  it("parses evaluations and rejects unknown", () => {
    expect(parseAcademicSectionShellTabParam("evaluations")).toBe("evaluations");
    expect(parseAcademicSectionShellTabParam("bogus")).toBeUndefined();
  });
});
