import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminHubTrafficChart } from "@/components/dashboard/AdminHubTrafficChart";

describe("AdminHubTrafficChart", () => {
  it("exposes the real daily visits series, not a fixed decorative path", () => {
    const { container } = render(
      <AdminHubTrafficChart
        locale="es"
        visitsLabel="Visitas"
        series={[
          { day: "2026-08-01", visits: 15 },
          { day: "2026-08-02", visits: 31 },
        ]}
      />,
    );
    const el = container.querySelector("[data-hub-traffic-visits]");
    expect(el?.getAttribute("data-hub-traffic-visits")).toBe("15,31");
  });

  it("shows a scale reference that does not depend on hover", () => {
    render(
      <AdminHubTrafficChart
        locale="es"
        visitsLabel="Visitas"
        series={[
          { day: "2026-08-01", visits: 15 },
          { day: "2026-08-02", visits: 31 },
        ]}
      />,
    );
    expect(screen.getByText(/Visitas 0–31/)).toBeInTheDocument();
  });
});
