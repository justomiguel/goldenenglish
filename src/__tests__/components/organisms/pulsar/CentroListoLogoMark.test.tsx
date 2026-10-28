import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  CentroListoGenerativeStage,
  CentroListoLogoMark,
} from "@/components/organisms/pulsar/CentroListoLogoMark";

describe("CentroListoLogoMark", () => {
  it("draws the sage loop and terracotta seed with the italic wordmark", () => {
    const { container } = render(<CentroListoLogoMark />);

    expect(container.querySelector("path")).toHaveAttribute(
      "stroke",
      "var(--color-primary)",
    );
    expect(container.querySelector("circle")).toHaveAttribute(
      "fill",
      "var(--color-accent)",
    );
    expect(screen.getByText("listo")).toBeInTheDocument();
  });

  it("replays the unknotting canvas when the person asks again", async () => {
    const user = userEvent.setup();
    render(
      <CentroListoGenerativeStage
        noiseCaption="late chats"
        resolvedCaption="everything in its place"
        replayLabel="Untangle the thread again"
        activeTenantsCount={6}
        tenantsLabel="schools today"
      />,
    );

    expect(screen.getByTestId("centrolisto-generative-logo")).toBeInTheDocument();
    expect(screen.getByLabelText("Untangle the thread again")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Untangle the thread again"));
    expect(screen.getByTestId("centrolisto-generative-logo")).toBeInTheDocument();
  });
});
