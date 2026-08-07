import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockPush } from "@/test/navigationMock";
import { ParentWardPicker } from "@/components/parent/ParentWardPicker";

const OPTIONS = [
  { studentId: "s1", displayName: "Student One" },
  { studentId: "s2", displayName: "Student Two" },
];

describe("ParentWardPicker — preserves other query params on change", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        href: "http://localhost/es/dashboard/parent/progress?tab=tasks&studentId=s1",
        origin: "http://localhost",
      },
    });
  });

  it("keeps tab=tasks and updates studentId when switching child", () => {
    render(
      <ParentWardPicker
        options={OPTIONS}
        selectedStudentId="s1"
        label="Alumno"
        hint="Selecciona un alumno"
        basePath="/es/dashboard/parent/progress"
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "s2" } });

    expect(mockPush).toHaveBeenCalledOnce();
    const pushedUrl: string = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).toContain("tab=tasks");
    expect(pushedUrl).toContain("studentId=s2");
    expect(pushedUrl).not.toContain("studentId=s1");
  });
});
