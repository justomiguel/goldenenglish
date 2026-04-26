import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionHealthChartHelpModal } from "@/components/molecules/AcademicSectionHealthChartHelpModal";

describe("AcademicSectionHealthChartHelpModal", () => {
  it("renders body as separate paragraphs split on blank lines", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AcademicSectionHealthChartHelpModal
        open
        onOpenChange={onOpenChange}
        title="Attendance mix"
        body={"First paragraph.\n\nSecond paragraph.\n\nThird."}
        closeLabel="Got it"
      />,
    );

    expect(screen.getByRole("heading", { name: "Attendance mix" })).toBeInTheDocument();
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Third.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
