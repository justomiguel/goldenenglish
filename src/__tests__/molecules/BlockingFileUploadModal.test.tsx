/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockingFileUploadModal } from "@/components/molecules/BlockingFileUploadModal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
}));

describe("BlockingFileUploadModal", () => {
  it("hides the header close while open and shows percent plus phase", () => {
    render(
      <BlockingFileUploadModal
        open
        title="Uploading file"
        filename="talk.mp4"
        fileIndex={null}
        phaseLabel="Uploading…"
        percent={42}
        indeterminate={false}
        runningAriaLabel="Loading"
      />,
    );

    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    expect(screen.getAllByText("42%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Uploading…").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("talk.mp4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "42");
  });

  it("exposes a polite live region and busy status while running", () => {
    render(
      <BlockingFileUploadModal
        open
        title="Uploading file"
        filename="pic.jpg"
        fileIndex="2 of 3"
        phaseLabel="Preparing file…"
        percent={null}
        indeterminate
        runningAriaLabel="Loading"
      />,
    );

    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    const live = document.querySelector("[aria-live='polite'][aria-atomic='true']");
    expect(live).not.toBeNull();
  });
});
