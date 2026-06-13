import { portalCalendarKindLabel } from "@/lib/calendar/portalCalendarKindLabel";
import dictEn from "@/dictionaries/en.json";

const legend = dictEn.dashboard.portalCalendar.legend;
const specialTypes = dictEn.dashboard.portalCalendar.specialTypes;

describe("portalCalendarKindLabel", () => {
  it("returns exam label", () => {
    expect(portalCalendarKindLabel("exam", undefined, legend, specialTypes)).toBe(legend.exam);
  });

  it("returns birthday label", () => {
    expect(portalCalendarKindLabel("birthday", undefined, legend, specialTypes)).toBe(legend.birthday);
  });

  it("returns institute event label", () => {
    expect(portalCalendarKindLabel("institute_event", undefined, legend, specialTypes)).toBe(
      legend.instituteEvent,
    );
  });

  it("returns special chip when type set", () => {
    expect(portalCalendarKindLabel("special", "holiday", legend, specialTypes)).toBe(specialTypes.holiday.chip);
  });
});
