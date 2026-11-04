import { describe, expect, it } from "vitest";
import {
  EMPTY_ADMIN_HOME_OPS,
  parseAdminHomeOpsSnapshot,
} from "@/lib/dashboard/parseAdminHomeOpsSnapshot";

describe("parseAdminHomeOpsSnapshot", () => {
  it("reads events, a cohort, class counts, trials, seats, waitlist, and payments", () => {
    const parsed = parseAdminHomeOpsSnapshot({
      email_used: 12,
      email_cap: 5000,
      events: [
        {
          id: "e1",
          slug: "show",
          title: "Show",
          event_date: "2026-11-20T20:00:00.000Z",
          capacity: 40,
          seats: 11,
        },
      ],
      waitlist_total: 4,
      cohort: { id: "c1", name: "2026", active_enrollments: 28 },
      classes_meeting: 3,
      classes_missing_attendance: 1,
      trials_booked: 2,
      trials_attended: 1,
      trials_released: 0,
      sections_full: 1,
      sections_one_left: 2,
      event_payments_pending_review: 5,
    });
    expect(parsed.emailUsed).toBe(12);
    expect(parsed.emailCap).toBe(5000);
    expect(parsed.events).toEqual([
      {
        id: "e1",
        slug: "show",
        title: "Show",
        eventDate: "2026-11-20T20:00:00.000Z",
        capacity: 40,
        seats: 11,
      },
    ]);
    expect(parsed.cohort).toEqual({ id: "c1", name: "2026", activeEnrollments: 28 });
    expect(parsed.classesMeeting).toBe(3);
    expect(parsed.classesMissingAttendance).toBe(1);
    expect(parsed.trialsBooked).toBe(2);
    expect(parsed.trialsAttended).toBe(1);
    expect(parsed.trialsReleased).toBe(0);
    expect(parsed.sectionsFull).toBe(1);
    expect(parsed.sectionsOneLeft).toBe(2);
    expect(parsed.waitlistTotal).toBe(4);
    expect(parsed.eventPaymentsPendingReview).toBe(5);
  });

  it("returns an empty snapshot when events and the cohort are absent", () => {
    const parsed = parseAdminHomeOpsSnapshot({ events: [], cohort: null });
    expect(parsed.events).toEqual([]);
    expect(parsed.cohort).toBeNull();
    expect(parsed.emailCap).toBe(EMPTY_ADMIN_HOME_OPS.emailCap);
    expect(parsed.classesMeeting).toBe(0);
  });
});
