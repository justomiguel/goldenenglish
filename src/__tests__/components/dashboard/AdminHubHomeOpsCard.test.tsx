import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminHubHomeOpsCard } from "@/components/dashboard/AdminHubHomeOpsCard";
import { EMPTY_ADMIN_HOME_OPS } from "@/lib/dashboard/parseAdminHomeOpsSnapshot";
import { dictEn } from "@/test/dictEn";

const base = "/en/dashboard/admin";

describe("AdminHubHomeOpsCard", () => {
  it("shows the mail fraction, event seats line is not this card, cohort, classes, trials, seats, waitlist, and payments", () => {
    const ops = {
      ...EMPTY_ADMIN_HOME_OPS,
      emailUsed: 12,
      emailCap: 5000,
      cohort: { id: "c1", name: "2026", activeEnrollments: 28 },
      classesMeeting: 3,
      classesMissingAttendance: 1,
      trialsBooked: 2,
      trialsAttended: 1,
      trialsReleased: 0,
      sectionsFull: 1,
      sectionsOneLeft: 2,
      waitlistTotal: 4,
      eventPaymentsPendingReview: 5,
    };
    const { rerender } = render(
      <AdminHubHomeOpsCard id="emailQuota" base={base} dict={dictEn} ops={ops} />,
    );
    expect(screen.getByText("12 / 5000")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="cohortEnrollments" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("2026 · 28 active")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="classesToday" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("3 meet today · 1 without a list")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="trialsThisWeek" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("2 booked · 1 attended · 0 released")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="sectionSeats" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("1 full · 2 with one seat")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="eventWaitlist" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("4 waiting")).toBeInTheDocument();

    rerender(<AdminHubHomeOpsCard id="eventPaymentsReview" base={base} dict={dictEn} ops={ops} />);
    expect(screen.getByText("5 to review")).toBeInTheDocument();
  });
});
