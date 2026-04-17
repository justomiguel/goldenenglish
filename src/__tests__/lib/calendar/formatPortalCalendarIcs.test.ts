import { describe, expect, it } from "vitest";
import { formatPortalCalendarIcs } from "@/lib/calendar/formatPortalCalendarIcs";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";

describe("formatPortalCalendarIcs", () => {
  it("includes VCALENDAR and timed class", () => {
    const ev: ExpandedPortalOccurrence = {
      kind: "class",
      title: "Test class",
      startMs: Date.UTC(2025, 3, 16, 12, 0, 0),
      endMs: Date.UTC(2025, 3, 16, 13, 0, 0),
      allDay: false,
      icsUid: "ge-class-test@goldenenglish",
    };
    const doc = formatPortalCalendarIcs([ev], { calName: "GE" });
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).toContain("GE_CLASS");
    expect(doc).toContain("SUMMARY:Test class");
    expect(doc).toContain("END:VCALENDAR");
  });

  it("includes DESCRIPTION when provided", () => {
    const ev: ExpandedPortalOccurrence = {
      kind: "special",
      title: "Day off",
      startMs: Date.UTC(2025, 5, 10, 12, 0, 0),
      endMs: Date.UTC(2025, 5, 11, 12, 0, 0),
      allDay: true,
      icsUid: "ge-special-1@goldenenglish",
      description: "No classes",
    };
    const doc = formatPortalCalendarIcs([ev]);
    expect(doc).toContain("DESCRIPTION:");
    expect(doc).toContain("No classes");
  });

  it("uses icsSummary and GE_SPECIAL_HOLIDAY when special has type holiday", () => {
    const ev: ExpandedPortalOccurrence = {
      kind: "special",
      specialEventType: "holiday",
      title: "Day off",
      icsSummary: "[HOLIDAY] Day off",
      icsDescription: "Legend line\n\nNo classes",
      startMs: Date.UTC(2025, 5, 10, 12, 0, 0),
      endMs: Date.UTC(2025, 5, 11, 12, 0, 0),
      allDay: true,
      icsUid: "ge-special-1@goldenenglish",
      description: "No classes",
    };
    const doc = formatPortalCalendarIcs([ev]);
    expect(doc).toContain("SUMMARY:[HOLIDAY] Day off");
    expect(doc).toContain("GE_SPECIAL_HOLIDAY");
    expect(doc).toContain("DESCRIPTION:");
  });

  it("emits all-day exam with VALUE=DATE", () => {
    const ev: ExpandedPortalOccurrence = {
      kind: "exam",
      title: "Exam",
      startMs: Date.UTC(2025, 5, 10, 12, 0, 0),
      endMs: Date.UTC(2025, 5, 11, 12, 0, 0),
      allDay: true,
      icsUid: "ge-exam-x@goldenenglish",
    };
    const doc = formatPortalCalendarIcs([ev]);
    expect(doc).toContain("DTSTART;VALUE=DATE:20250610");
    expect(doc).toContain("GE_EXAM");
  });
});
