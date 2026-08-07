/**
 * Subject: AcademicSectionShellWorkspace
 *
 * Groups:
 * 1. Opening an area pushes a history entry (pushState, not router.push/replace)
 * 2. The URL drives the view (useSearchParams is the source of truth)
 * 3. Unknown/absent tab falls back to the hub
 * 4. No server refetch when switching areas (router.push/replace not called)
 * 5. Area lead icon sizing (existing regression check)
 *
 * Navigation is provided by the global Vitest setup (src/test/setup.tsx), which
 * mocks next/navigation. Per-test overrides use the helpers from navigationMock.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockPathname, mockPush, mockReplace, mockSearchParams } from "@/test/navigationMock";
import { AcademicSectionShellWorkspace } from "@/components/organisms/AcademicSectionShellWorkspace";

const PATHNAME = "/en/dashboard/admin/academic/c/s";

const labels = {
  hubAreasAria: "Areas",
  backToSection: "Back",
  areaSwitcherAria: "Switch",
  generalLead: "General",
  configuration: "Configuration",
  configurationLead: "Config lead",
  teachers: "Teachers",
  teachersLead: "Teachers lead text",
  learningRoute: "Route",
  learningRouteLead: "Route lead",
  evaluations: "Evaluations",
  evaluationsLead: "Evaluations lead",
  fees: "Fees",
  feesLead: "Fees lead",
  attendance: "Attendance",
  attendanceLead: "Attendance lead",
  students: "Students",
  studentsLead: "Students lead",
} as const;

const defaultFlags = { requiresEvaluationsToPass: false, usesLearningRoute: false };

function renderWorkspace(extraProps: Partial<React.ComponentProps<typeof AcademicSectionShellWorkspace>> = {}) {
  return render(
    <AcademicSectionShellWorkspace
      labels={labels}
      featureFlags={defaultFlags}
      hubOverview={<div data-testid="hub-overview" />}
      configuration={<div data-testid="configuration-panel" />}
      teachers={<div data-testid="teachers-panel" />}
      learningRoute={null}
      evaluations={null}
      fees={<div data-testid="fees-panel" />}
      attendance={<div data-testid="attendance-panel" />}
      students={<div data-testid="students-panel" />}
      {...extraProps}
    />,
  );
}

beforeEach(() => {
  mockPathname.mockReturnValue(PATHNAME);
  mockSearchParams.mockReturnValue(new URLSearchParams());
});

// ---------------------------------------------------------------------------
// Group 1: Opening an area pushes a history entry
// ---------------------------------------------------------------------------
describe("1 — Opening an area pushes history", () => {
  it("calls window.history.pushState with the correct URL when a hub card is clicked", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    renderWorkspace();

    // Click the Fees hub card (visible with defaultFlags)
    fireEvent.click(screen.getByRole("button", { name: /Fees/ }));

    expect(pushState).toHaveBeenCalledWith(null, "", `${PATHNAME}?tab=fees`);
    pushState.mockRestore();
  });

  it("calls pushState with pathname only when navigating back to hub", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    // Start in fees area
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=fees"));
    renderWorkspace();

    // Click Back
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));

    expect(pushState).toHaveBeenCalledWith(null, "", PATHNAME);
    pushState.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Group 2: The URL drives the view
// ---------------------------------------------------------------------------
describe("2 — URL drives the view", () => {
  it("renders the fees panel when useSearchParams returns tab=fees", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=fees"));
    renderWorkspace();

    expect(screen.getByTestId("fees-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-overview")).not.toBeInTheDocument();
  });

  it("renders the students panel when useSearchParams returns tab=students", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=students"));
    renderWorkspace();

    expect(screen.getByTestId("students-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-overview")).not.toBeInTheDocument();
  });

  it("renders the teachers panel when useSearchParams returns tab=teachers", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=teachers"));
    renderWorkspace();

    expect(screen.getByTestId("teachers-panel")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Group 3: Unknown or absent tab falls back to hub
// ---------------------------------------------------------------------------
describe("3 — Unknown/absent tab falls back to hub", () => {
  it("shows the hub when no tab is in the URL", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    renderWorkspace();

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });

  it("shows the hub for an unrecognised tab value", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=nonexistent"));
    renderWorkspace();

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });

  it("shows the hub when tab=general (legacy value)", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=general"));
    renderWorkspace();

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });

  it("shows hub for evaluations when flag is off", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=evaluations"));
    // evaluations is gated by requiresEvaluationsToPass=false
    renderWorkspace({ featureFlags: { requiresEvaluationsToPass: false, usesLearningRoute: false } });

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Group 4: No server refetch when switching areas
// ---------------------------------------------------------------------------
describe("4 — No server refetch when switching areas", () => {
  it("does not call router.push when a hub card is clicked", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: /Fees/ }));

    expect(mockPush).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it("does not call router.replace when a hub card is clicked", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: /Fees/ }));

    expect(mockReplace).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it("does not call router.push when navigating back to hub", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=fees"));
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));

    expect(mockPush).not.toHaveBeenCalled();
    pushState.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Group 5: Area lead icon sizing (existing regression, kept)
// ---------------------------------------------------------------------------
describe("5 — Area lead icon sizing", () => {
  it("uses h-5 w-5 icon on area lead when an area is open", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=teachers"));
    const { container } = renderWorkspace();

    expect(screen.getByText("Teachers lead text")).toBeInTheDocument();
    const icon = container.querySelector("svg.h-5.w-5");
    expect(icon).toBeTruthy();
  });
});
