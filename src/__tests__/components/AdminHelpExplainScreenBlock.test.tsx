// REGRESSION CHECK: Explain-screen block must show enabled CTA only when a tour
// exists for the route; unavailable state keeps a disabled button (spec default).
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpExplainScreenBlock } from "@/components/dashboard/AdminHelpExplainScreenBlock";

const dict = {
  sectionHeading: "This screen",
  sectionAria: "Explain this screen",
  startCta: "Explain this screen",
  startCtaAria: "Explain this screen: {{title}}",
  starting: "Starting…",
  unavailable: "A guided explanation for this screen is coming soon.",
  unavailableCtaAria: "Explain this screen (not available yet)",
};

describe("AdminHelpExplainScreenBlock", () => {
  it("enables CTA and calls onStart when a tour is available", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <AdminHelpExplainScreenBlock
        dict={dict}
        screenTitle="Admin home"
        screenDescription="Overview of the hub"
        available
        onStart={onStart}
      />,
    );

    expect(screen.getByText("Admin home")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: "Explain this screen: Admin home" });
    expect(cta).not.toBeDisabled();
    await user.click(cta);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("disables CTA and shows unavailable copy when no tour", () => {
    render(
      <AdminHelpExplainScreenBlock
        dict={dict}
        screenTitle={null}
        screenDescription={null}
        available={false}
        onStart={() => undefined}
      />,
    );

    expect(
      screen.getByText("A guided explanation for this screen is coming soon."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Explain this screen (not available yet)" }),
    ).toBeDisabled();
  });
});
