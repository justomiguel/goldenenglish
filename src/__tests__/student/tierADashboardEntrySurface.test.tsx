import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { StudentDashboardEntry } from "@/components/student/StudentDashboardEntry";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";
import { ParentPaymentsEntry } from "@/components/parent/ParentPaymentsEntry";

vi.mock("@/components/student/AttendancePlayboard", () => ({
  AttendancePlayboard: () => <div data-testid="playboard" />,
}));

vi.mock("@/components/molecules/SurfaceMountGate", () => ({
  SurfaceMountGate: ({
    skeleton,
    desktop,
    narrow,
  }: {
    skeleton: React.ReactNode;
    desktop: React.ReactNode;
    narrow: (surface: "web-mobile") => React.ReactNode;
  }) => (
    <div>
      <div data-testid="sk">{skeleton}</div>
      <div data-testid="desktop">{desktop}</div>
      <div data-testid="narrow">{narrow("web-mobile")}</div>
    </div>
  ),
}));

describe("Tier A entries — SurfaceMountGate branches", () => {
  it("StudentDashboardEntry exposes skeleton, desktop, and narrow", () => {
    render(
      <StudentDashboardEntry
        locale="en"
        title="T"
        kicker="Student area"
        greeting="Hello"
        fullDateLine="Monday"
        firstName={null}
        engagementPoints={0}
        rows={[]}
        labels={dictEn.dashboard.student}
        hub={null}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getByTestId("desktop")).toBeInTheDocument();
    expect(screen.getByTestId("narrow")).toBeInTheDocument();
    expect(screen.getAllByTestId("playboard")).toHaveLength(2);
  });

  it("ParentDashboardEntry exposes skeleton, desktop, and narrow", () => {
    render(
      <ParentDashboardEntry
        locale="es"
        title="P"
        lead="L"
        kicker="Área familias"
        greeting="Hola"
        fullDateLine="lunes"
        firstName={null}
        navPay="Pay"
        payHref="/es/x"
        kids={[{ id: "1", first_name: "A", last_name: "B" }]}
        parentLabels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getByTestId("narrow")).toBeInTheDocument();
  });

  it("ParentPaymentsEntry exposes skeleton, desktop, and narrow", () => {
    render(
      <ParentPaymentsEntry
        locale="en"
        title="Pay"
        lead="L"
        options={[{ id: "1", label: "Kid" }]}
        labels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getByTestId("narrow")).toBeInTheDocument();
  });
});
