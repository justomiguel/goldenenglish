import { describe, expect, it } from "vitest";
import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";
import {
  buildSectionEnrollmentLinkPath,
  parseSectionEnrollmentLinkSegments,
} from "@/lib/register/sectionEnrollmentLinkPath";

const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("sectionEnrollmentLinkPath", () => {
  it("slugifies like event titles and falls back to seccion", () => {
    expect(slugifyPublicPathSegment("  Niño & Música 2026 ")).toBe("nino-musica-2026");
    expect(slugifyPublicPathSegment("!!!")).toBe("");
  });

  it("builds locale/slug/uuid and parses one or two segments", () => {
    expect(buildSectionEnrollmentLinkPath("es", "Kids A1", TOKEN)).toBe(
      `/es/i/kids-a1/${TOKEN}`,
    );
    expect(buildSectionEnrollmentLinkPath("es", "!!!", TOKEN)).toBe(
      `/es/i/seccion/${TOKEN}`,
    );
    expect(parseSectionEnrollmentLinkSegments([TOKEN])).toEqual({
      slug: null,
      token: TOKEN,
    });
    expect(parseSectionEnrollmentLinkSegments(["kids-a1", TOKEN])).toEqual({
      slug: "kids-a1",
      token: TOKEN,
    });
    expect(parseSectionEnrollmentLinkSegments(["nope"])).toBeNull();
  });
});
