/**
 * Subject: AcademicSectionShellWorkspace
 *
 * Groups:
 * 1. Opening an area pushes a history entry and shows that panel
 * 2. initialArea opens the matching panel (direct load / ?tab=)
 * 3. Unknown/absent tab falls back to the hub
 * 4. No server refetch when switching areas (router.push/replace not called)
 * 5. Area lead icon sizing (existing regression check)
 * 6. Back/forward (popstate) follows the URL
 *
 * Navigation is provided by the global Vitest setup (src/test/setup.tsx), which
 * mocks next/navigation. Per-test overrides use the helpers from navigationMock.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
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

    expect(pushState).toHaveBeenCalledWith(
      expect.objectContaining({ __NA: true }),
      "",
      `${PATHNAME}?tab=fees`,
    );
    expect(screen.getByTestId("fees-panel")).toBeInTheDocument();
    pushState.mockRestore();
  });

  it("calls pushState with pathname only when navigating back to hub", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderWorkspace({ initialArea: "fees" });

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));

    expect(pushState).toHaveBeenCalledWith(expect.objectContaining({ __NA: true }), "", PATHNAME);
    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
    pushState.mockRestore();
  });

  it("shows the students panel on click while search params stay empty", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: /Students/ }));

    expect(screen.getByTestId("students-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-overview")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Group 2: The URL drives the view
// ---------------------------------------------------------------------------
describe("2 — URL drives the view", () => {
  it("renders the fees panel when initialArea is fees", () => {
    renderWorkspace({ initialArea: "fees" });

    expect(screen.getByTestId("fees-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-overview")).not.toBeInTheDocument();
  });

  it("renders the students panel when initialArea is students", () => {
    renderWorkspace({ initialArea: "students" });

    expect(screen.getByTestId("students-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-overview")).not.toBeInTheDocument();
  });

  it("renders the teachers panel when initialArea is teachers", () => {
    renderWorkspace({ initialArea: "teachers" });

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
    window.history.replaceState(null, "", `${PATHNAME}?tab=nonexistent`);
    renderWorkspace({ initialArea: "students" });
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });

  it("shows the hub when tab=general (legacy value)", () => {
    window.history.replaceState(null, "", `${PATHNAME}?tab=general`);
    renderWorkspace({ initialArea: "students" });
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
  });

  it("shows hub for evaluations when flag is off", () => {
    renderWorkspace({
      initialArea: "evaluations",
      featureFlags: { requiresEvaluationsToPass: false, usesLearningRoute: false },
    });

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
    renderWorkspace({ initialArea: "fees" });

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
    const { container } = renderWorkspace({ initialArea: "teachers" });

    expect(screen.getByText("Teachers lead text")).toBeInTheDocument();
    const icon = container.querySelector("svg.h-5.w-5");
    expect(icon).toBeTruthy();
  });
});

describe("6 — Browser back follows the URL", () => {
  it("returns to the hub when popstate clears the tab", () => {
    renderWorkspace({ initialArea: "students" });
    window.history.pushState(null, "", PATHNAME);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("hub-overview")).toBeInTheDocument();
    expect(screen.queryByTestId("students-panel")).not.toBeInTheDocument();
  });
});

// REGRESSION CHECK: Enrollment link panel belongs on the section hub only so area tabs open above the fold on mobile.
describe("7 — Enrollment link panel visibility", () => {
  it("shows enrollmentLinkPanel on the section hub and hides it when an area is open", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderWorkspace({
      enrollmentLinkPanel: <div data-testid="enrollment-link-panel" />,
    });

    expect(screen.getByTestId("enrollment-link-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Students/ }));

    expect(screen.queryByTestId("enrollment-link-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("students-panel")).toBeInTheDocument();
    pushState.mockRestore();
  });
});
