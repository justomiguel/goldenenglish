import { describe, expect, it } from "vitest";
import { portalCalendarAdminEditHref } from "@/lib/calendar/portalCalendarAdminEditHref";

const SPECIAL_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const INSTITUTE_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

describe("portalCalendarAdminEditHref", () => {
  it("returns special event edit path", () => {
    expect(
      portalCalendarAdminEditHref(
        "es",
        `ge-special-${SPECIAL_ID}@goldenenglish-0`,
        "special",
      ),
    ).toBe(`/es/dashboard/admin/calendar/special/${SPECIAL_ID}`);
  });

  it("returns institute event edit path", () => {
    expect(
      portalCalendarAdminEditHref(
        "en",
        `ge-institute-event-${INSTITUTE_ID}@goldenenglish-2`,
        "institute_event",
      ),
    ).toBe(`/en/dashboard/admin/events/${INSTITUTE_ID}`);
  });

  it("returns null for non-editable kinds", () => {
    expect(portalCalendarAdminEditHref("es", `ge-class-x@goldenenglish-0`, "class")).toBeNull();
  });
});
