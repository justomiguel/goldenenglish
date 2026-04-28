/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentStudentQueue } from "@/components/molecules/EnrollmentStudentQueue";

describe("EnrollmentStudentQueue", () => {
  it("renders legend and chips", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <EnrollmentStudentQueue
        legend="On list"
        reminder="Save below"
        removeAria="Remove"
        items={[
          { id: "a", label: "One" },
          { id: "b", label: "Two" },
        ]}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText("On list")).toBeInTheDocument();
    expect(screen.getByText("Save below")).toBeInTheDocument();
    const removes = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removes[0]!);
    expect(onRemove).toHaveBeenCalledWith("a");
  });
});
