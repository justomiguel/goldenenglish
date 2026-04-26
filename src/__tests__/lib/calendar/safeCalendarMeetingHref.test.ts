import { safeCalendarMeetingHref } from "@/lib/calendar/safeCalendarMeetingHref";

describe("safeCalendarMeetingHref", () => {
  it("allows https", () => {
    expect(safeCalendarMeetingHref("  https://x.test/y  ")).toBe("https://x.test/y");
  });

  it("allows mailto", () => {
    expect(safeCalendarMeetingHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });

  it("rejects javascript and http", () => {
    expect(safeCalendarMeetingHref("javascript:alert(1)")).toBeNull();
    expect(safeCalendarMeetingHref("http://insecure")).toBeNull();
  });
});
