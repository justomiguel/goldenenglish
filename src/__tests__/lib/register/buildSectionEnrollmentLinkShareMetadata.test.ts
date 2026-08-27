import { describe, expect, it } from "vitest";
import { buildSectionEnrollmentLinkShareMetadata } from "@/lib/register/buildSectionEnrollmentLinkShareMetadata";
import { SECTION_SHARE_FALLBACK_PATH } from "@/lib/register/sectionReferenceImage";

const weekdays = {
  sun: "Dom",
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
};

describe("buildSectionEnrollmentLinkShareMetadata", () => {
  it("builds title and schedule description without seats", () => {
    const meta = buildSectionEnrollmentLinkShareMetadata({
      locale: "es",
      brandName: "Instituto",
      sectionName: "Kids A1",
      token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      cohortName: "Ciclo 2026",
      scheduleSlots: [
        { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
      ],
      weekdays,
      referenceImagePublicUrl: "https://cdn.example/sec.jpg",
    });
    expect(meta.title).toBe("Kids A1 · Instituto");
    expect(meta.description).toBe("Ciclo 2026 · Lun 18:00–19:30, Mié 09:00–10:00");
    expect(meta.path).toBe("/es/i/kids-a1/3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    expect(meta.description).not.toMatch(/cupo|seat/i);
    expect(meta.coverImageUrl).toBe("https://cdn.example/sec.jpg");
  });

  it("omits empty parts and uses the generic fallback image", () => {
    const meta = buildSectionEnrollmentLinkShareMetadata({
      locale: "es",
      brandName: "Instituto",
      sectionName: "Kids A1",
      token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      cohortName: "",
      scheduleSlots: [],
      weekdays,
      referenceImagePublicUrl: null,
    });
    expect(meta.description).toBe("");
    expect(meta.coverImageUrl).toBe(SECTION_SHARE_FALLBACK_PATH);
    expect(meta.path).toBe("/es/i/kids-a1/3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });
});
