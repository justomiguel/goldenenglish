import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LongJobLoader } from "@/components/molecules/LongJobLoader";

describe("LongJobLoader", () => {
  it("shows spinner and sr-only label when running", () => {
    render(
      <LongJobLoader
        isRunning
        runningAriaLabel="Working…"
        progressLine="Row 2 of 5"
        statusMessage={null}
        errorDetail={null}
      />,
    );
    expect(screen.getByText("Working…")).toBeInTheDocument();
    expect(screen.getByText("Row 2 of 5")).toBeInTheDocument();
    const root = screen.getByText("Row 2 of 5").closest('[aria-busy="true"]');
    expect(root).toBeTruthy();
  });

  it("hides spinner when not running", () => {
    const { container } = render(
      <LongJobLoader
        isRunning={false}
        progressLine={null}
        statusMessage="Done"
        errorDetail={null}
      />,
    );
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Done").closest("[aria-busy]")).toHaveAttribute("aria-busy", "false");
  });
});
