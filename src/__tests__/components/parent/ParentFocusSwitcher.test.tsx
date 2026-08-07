import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import { ParentFocusSwitcher } from "@/components/parent/ParentFocusSwitcher";

const push = vi.fn();
const searchParams = new URLSearchParams("studentId=s1&sectionId=sec-a");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/es/dashboard/parent/progress",
  useSearchParams: () => searchParams,
}));

const labels = {
  childLabel: "Child",
  sectionLabel: "Class",
  childSelectAria: "Select child",
  sectionSelectAria: "Select class",
  noActiveSection: "No active class",
  focusBarAria: "Family focus",
};

const multiCatalog: ParentFocusCatalog = {
  students: [
    { studentId: "s1", displayName: "Ana" },
    { studentId: "s2", displayName: "Bruno" },
  ],
  sectionsByStudentId: {
    s1: [
      { sectionId: "sec-a", classLabel: "Teens — A1" },
      { sectionId: "sec-b", classLabel: "Kids — B1" },
    ],
    s2: [{ sectionId: "sec-c", classLabel: "Adults — C1" }],
  },
};

describe("ParentFocusSwitcher", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders labels when there is one student and one section", () => {
    render(
      <ParentFocusSwitcher
        catalog={{
          students: [{ studentId: "s1", displayName: "Ana" }],
          sectionsByStudentId: {
            s1: [{ sectionId: "sec-a", classLabel: "Teens — A1" }],
          },
        }}
        labels={labels}
        variant="pwa-home"
      />,
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Teens — A1")).toBeInTheDocument();
  });

  it("shows no-active-section copy when the student has no sections", () => {
    render(
      <ParentFocusSwitcher
        catalog={{
          students: [{ studentId: "s1", displayName: "Ana" }],
          sectionsByStudentId: {},
        }}
        labels={labels}
        variant="pwa-sticky"
      />,
    );
    expect(screen.getByText("No active class")).toBeInTheDocument();
  });

  it("offers selects for multiple students and sections on PWA", async () => {
    const user = userEvent.setup();
    render(
      <ParentFocusSwitcher catalog={multiCatalog} labels={labels} variant="pwa-home" />,
    );
    expect(screen.getByLabelText("Select child")).toBeInTheDocument();
    expect(screen.getByLabelText("Select class")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Select child"), "s2");
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("studentId=s2"),
    );
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("sectionId=sec-c"),
    );
  });

  it("renders desktop chips for multiple students", () => {
    render(
      <ParentFocusSwitcher
        catalog={multiCatalog}
        labels={labels}
        variant="desktop-sidebar"
      />,
    );
    expect(screen.getByRole("link", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teens — A1" })).toBeInTheDocument();
  });
});
