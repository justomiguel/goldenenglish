import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminRegistrationsStatsRow } from "@/components/dashboard/AdminRegistrationsStatsRow";
import { dictEn } from "@/test/dictEn";

describe("AdminRegistrationsStatsRow", () => {
  it("renders four primary KPI values from existing status counts", () => {
    render(
      <AdminRegistrationsStatsRow
        locale="en"
        labels={dictEn.admin.registrations.stats}
        total={10}
        pending={4}
        contacted={3}
        enrolled={3}
      />,
    );

    expect(screen.getByText(dictEn.admin.registrations.stats.total)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.registrations.stats.pending)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.registrations.stats.contacted)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.registrations.stats.enrolled)).toBeInTheDocument();
    expect(screen.getAllByText("10")).toHaveLength(1);
    expect(screen.getAllByText("4")).toHaveLength(1);
    const values = screen.getAllByText("3");
    expect(values.length).toBeGreaterThanOrEqual(2);
    for (const node of [screen.getByText("10"), screen.getByText("4"), ...values]) {
      expect(node.className).toContain("--color-primary");
      expect(node.className).not.toContain("--color-secondary");
    }
  });
});
