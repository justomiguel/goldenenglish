import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentWardPicker } from "@/components/parent/ParentWardPicker";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ParentWardPicker", () => {
  it("shows a label instead of select when only one ward", () => {
    render(
      <ParentWardPicker
        options={[{ studentId: "a", displayName: "Lopez, Ana" }]}
        selectedStudentId="a"
        label="Student"
        hint="Switch student"
        basePath="/en/dashboard/parent/progress"
      />,
    );
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Lopez, Ana")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders select when multiple wards", () => {
    render(
      <ParentWardPicker
        options={[
          { studentId: "a", displayName: "Lopez, Ana" },
          { studentId: "b", displayName: "Diaz, Bruno" },
        ]}
        selectedStudentId="a"
        label="Student"
        hint="Switch student"
        basePath="/en/dashboard/parent/progress"
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Diaz, Bruno" })).toBeInTheDocument();
  });
});
