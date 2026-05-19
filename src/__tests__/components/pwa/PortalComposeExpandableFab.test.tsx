import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PenLine } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { PortalComposeExpandableFab } from "@/components/pwa/molecules/PortalComposeExpandableFab";

describe("PortalComposeExpandableFab", () => {
  it("renders with accessible name and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PortalComposeExpandableFab label="Write message" Icon={PenLine} onClick={onClick} />,
    );

    const fab = screen.getByRole("button", { name: "Write message" });
    expect(fab).toHaveClass("fixed");

    await user.click(fab);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
