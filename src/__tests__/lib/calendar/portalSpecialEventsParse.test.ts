import { describe, expect, it } from "vitest";
import { createSpecialCalendarEventSchema } from "@/lib/calendar/portalSpecialEventsParse";

describe("createSpecialCalendarEventSchema", () => {
  it("requires times when not all-day", () => {
    const r = createSpecialCalendarEventSchema.safeParse({
      locale: "es",
      title: "X",
      eventDate: "2025-01-02",
      allDay: false,
      eventType: "social",
      calendarScope: "global",
    });
    expect(r.success).toBe(false);
  });

  it("accepts all-day without times", () => {
    const r = createSpecialCalendarEventSchema.safeParse({
      locale: "es",
      title: "Assembly",
      notes: "",
      eventDate: "2025-01-02",
      allDay: true,
      eventType: "social",
      calendarScope: "global",
    });
    expect(r.success).toBe(true);
  });

  it("requires cohort id for cohort scope", () => {
    const r = createSpecialCalendarEventSchema.safeParse({
      locale: "es",
      title: "Assembly",
      eventDate: "2025-01-02",
      allDay: true,
      eventType: "holiday",
      calendarScope: "cohort",
      cohortId: "",
      sectionId: "",
    });
    expect(r.success).toBe(false);
  });
});
