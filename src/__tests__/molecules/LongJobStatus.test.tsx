import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LongJobStatus } from "@/components/molecules/LongJobStatus";

describe("LongJobStatus", () => {
  it("renders progress, status and detail when provided", () => {
    render(
      <LongJobStatus
        progressLine="Row 2 of 5"
        statusMessage="Done"
        errorDetail="line a"
      />,
    );
    expect(screen.getByText("Row 2 of 5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Done");
    expect(screen.getByText("line a")).toBeInTheDocument();
  });

  it("renders nothing when all null", () => {
    const { container } = render(
      <LongJobStatus progressLine={null} statusMessage={null} errorDetail={null} />,
    );
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("pre")).toBeNull();
  });
});
