import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockPathname, mockPush, mockSearchParams } from "@/test/navigationMock";
import { PortalSubjectChips } from "@/components/portal/PortalSubjectChips";
import type { PortalSubjectGroup } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent/progress";

const CHILD_GROUP: PortalSubjectGroup = {
  param: "studentId",
  label: "Alumno",
  options: [
    { id: "s1", label: "Mateo" },
    { id: "s2", label: "Ana" },
  ],
  activeId: "s1",
};

const SECTION_GROUP: PortalSubjectGroup = {
  param: "sectionId",
  label: "Clase",
  options: [
    { id: "sec1", label: "B1" },
    { id: "sec2", label: "Conversation" },
  ],
  activeId: "sec1",
};

describe("PortalSubjectChips", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s1&sectionId=sec1"));
    mockPush.mockClear();
  });

  it("renders nothing when there is a single child in a single section", () => {
    const { container } = render(<PortalSubjectChips groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("labels each group and marks the active chip as pressed", () => {
    render(<PortalSubjectChips groups={[CHILD_GROUP, SECTION_GROUP]} />);
    expect(screen.getByRole("group", { name: "Alumno" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Clase" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mateo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Ana" })).toHaveAttribute("aria-pressed", "false");
  });

  it("stays on the current route when switching section", async () => {
    const user = userEvent.setup();
    render(<PortalSubjectChips groups={[SECTION_GROUP]} />);
    await user.click(screen.getByRole("button", { name: "Conversation" }));
    expect(mockPush).toHaveBeenCalledWith(`${BASE}?studentId=s1&sectionId=sec2`);
  });

  it("drops the stale section when switching child", async () => {
    const user = userEvent.setup();
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    await user.click(screen.getByRole("button", { name: "Ana" }));
    expect(mockPush).toHaveBeenCalledWith(`${BASE}?studentId=s2`);
  });

  it("preserves unrelated query params", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=tasks&studentId=s1"));
    const user = userEvent.setup();
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    await user.click(screen.getByRole("button", { name: "Ana" }));
    expect(mockPush).toHaveBeenCalledWith(`${BASE}?tab=tasks&studentId=s2`);
  });

  it("lets the URL override the server-side default", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2"));
    const user = userEvent.setup();
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    expect(screen.getByRole("button", { name: "Ana" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Ana" }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when the active chip is tapped again", async () => {
    const user = userEvent.setup();
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    await user.click(screen.getByRole("button", { name: "Mateo" }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
