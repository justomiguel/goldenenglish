import { describe, expect, it } from "vitest";
import { filterSpecialCalendarRowsForViewer } from "@/lib/calendar/filterSpecialCalendarRowsForViewer";
import type { PortalSpecialCalendarEventRow } from "@/lib/calendar/portalSpecialCalendarEventRow";

const base = (over: Partial<PortalSpecialCalendarEventRow>): PortalSpecialCalendarEventRow => ({
  id: "ev-1",
  title: "T",
  notes: null,
  starts_at: "2025-06-01T12:00:00.000Z",
  ends_at: "2025-06-02T12:00:00.000Z",
  all_day: true,
  event_type: "social",
  calendar_scope: "global",
  cohort_id: null,
  section_id: null,
  meeting_url: null,
  ...over,
});

describe("filterSpecialCalendarRowsForViewer", () => {
  it("returns all rows for admin", () => {
    const rows = [base({ id: "a" }), base({ id: "b", event_type: "parent_meeting" })];
    const out = filterSpecialCalendarRowsForViewer(rows, {
      role: "admin",
      userId: "u-admin",
      viewerSectionIds: [],
      viewerCohortIds: [],
    });
    expect(out).toHaveLength(2);
  });

  it("hides parent_meeting from students", () => {
    const rows = [base({ event_type: "parent_meeting", calendar_scope: "global" })];
    const out = filterSpecialCalendarRowsForViewer(rows, {
      role: "student",
      userId: "stu",
      viewerSectionIds: ["s1"],
      viewerCohortIds: ["c1"],
    });
    expect(out).toHaveLength(0);
  });

  it("shows parent_meeting to parent when scoped to child section", () => {
    const rows = [
      base({
        event_type: "parent_meeting",
        calendar_scope: "section",
        cohort_id: null,
        section_id: "s1",
      }),
    ];
    const out = filterSpecialCalendarRowsForViewer(rows, {
      role: "parent",
      userId: "par",
      viewerSectionIds: ["s1"],
      viewerCohortIds: ["c1"],
    });
    expect(out).toHaveLength(1);
  });

  it("shows parent_meeting to teacher only for their section", () => {
    const rows = [
      base({
        event_type: "parent_meeting",
        calendar_scope: "section",
        section_id: "s1",
      }),
    ];
    expect(
      filterSpecialCalendarRowsForViewer(rows, {
        role: "teacher",
        userId: "t1",
        viewerSectionIds: ["s1"],
        viewerCohortIds: ["c1"],
      }),
    ).toHaveLength(1);
    expect(
      filterSpecialCalendarRowsForViewer(rows, {
        role: "teacher",
        userId: "t1",
        viewerSectionIds: ["s2"],
        viewerCohortIds: ["c1"],
      }),
    ).toHaveLength(0);
  });

  it("filters cohort-scoped holiday by cohort membership", () => {
    const rows = [
      base({
        event_type: "holiday",
        calendar_scope: "cohort",
        cohort_id: "c9",
        section_id: null,
      }),
    ];
    expect(
      filterSpecialCalendarRowsForViewer(rows, {
        role: "student",
        userId: "stu",
        viewerSectionIds: ["sx"],
        viewerCohortIds: ["c9"],
      }),
    ).toHaveLength(1);
    expect(
      filterSpecialCalendarRowsForViewer(rows, {
        role: "student",
        userId: "stu",
        viewerSectionIds: ["sx"],
        viewerCohortIds: ["c8"],
      }),
    ).toHaveLength(0);
  });
});
