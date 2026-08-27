import { describe, expect, it } from "vitest";
import { buildSectionEnrollmentLinkPageMetadata } from "@/lib/register/buildSectionEnrollmentLinkPageMetadata";

const weekdays = {
  sun: "Dom",
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
};

describe("buildSectionEnrollmentLinkPageMetadata", () => {
  it("uses unavailable copy when the link is missing", () => {
    const meta = buildSectionEnrollmentLinkPageMetadata({
      locale: "es",
      brandName: "Instituto",
      weekdays,
      unavailableTitle: "Este enlace ya no está disponible",
      link: null,
    });
    expect(meta.title).toBe("Este enlace ya no está disponible");
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("exposes share title, description and noindex for a valid link", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    try {
      const meta = buildSectionEnrollmentLinkPageMetadata({
        locale: "es",
        brandName: "Instituto",
        weekdays,
        unavailableTitle: "gone",
        link: {
          token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
          sectionId: "11111111-1111-4111-8111-111111111111",
          sectionName: "Kids A1",
          cohortName: "Ciclo 2026",
          scheduleSlots: [],
          seatsRemaining: null,
          referenceImagePath: null,
        },
      });
      expect(meta.title).toBe("Kids A1 · Instituto");
      expect(meta.robots).toEqual({ index: false, follow: false });
      expect(meta.openGraph?.url).toContain("/es/i/kids-a1/");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });
});
