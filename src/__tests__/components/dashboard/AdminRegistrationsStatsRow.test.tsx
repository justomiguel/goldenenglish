import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminRegistrationsStatsRow } from "@/components/dashboard/AdminRegistrationsStatsRow";
import { RegistrationCohortSelect } from "@/components/molecules/RegistrationCohortSelect";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/registrations",
  useSearchParams: () => new URLSearchParams(),
}));

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

  it("renders the cohort combo before the four cards", () => {
    render(
      <AdminRegistrationsStatsRow
        locale="es"
        labels={dictEn.admin.registrations.stats}
        total={2}
        pending={1}
        contacted={1}
        enrolled={0}
        cohortSelect={
          <RegistrationCohortSelect
            label="Cohorte"
            cohorts={[{ id: "c1", name: "2027" }]}
            value="c1"
          />
        }
      />,
    );

    const combo = screen.getByRole("combobox", { name: "Cohorte" });
    const total = screen.getByText(dictEn.admin.registrations.stats.total);
    expect(combo.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
