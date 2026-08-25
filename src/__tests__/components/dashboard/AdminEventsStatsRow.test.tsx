import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminEventsStatsRow } from "@/components/dashboard/AdminEventsStatsRow";

describe("AdminEventsStatsRow", () => {
  it("renders three primary KPI values", () => {
    render(
      <AdminEventsStatsRow
        locale="en"
        totalLabel="Events"
        totalHint="events"
        upcomingLabel="Upcoming"
        waitlistLabel="Waitlist"
        shareOfTotal="{{pct}}% of the total"
        total={8}
        upcoming={3}
        waitlist={1}
      />,
    );
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Waitlist")).toBeInTheDocument();
    for (const value of ["8", "3", "1"]) {
      const node = screen.getByText(value);
      expect(node.className).toContain("--color-primary");
      expect(node.className).not.toContain("--color-secondary");
    }
  });
});
