import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";

// REGRESSION CHECK: Upload UX must expose native progress semantics for a11y.
describe("InlineUploadProgressBar", () => {
  it("renders determinate progress with label and percentage", () => {
    render(
      <InlineUploadProgressBar label="Preparing file…" value={42} indeterminate={false} />,
    );
    expect(screen.getByText("Preparing file…")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("renders indeterminate progress without numeric value", () => {
    render(<InlineUploadProgressBar label="Saving…" indeterminate />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("value");
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
});
