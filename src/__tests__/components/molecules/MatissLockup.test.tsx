import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatissLockup } from "@/components/molecules/MatissLockup";

describe("MatissLockup", () => {
  it("splits the brand name into the wordmark and the tagline", () => {
    render(<MatissLockup brandName="Matiss Studio" />);

    expect(screen.getByText("Matiss")).toBeInTheDocument();
    expect(screen.getByText("Studio")).toBeInTheDocument();
  });

  it("renders only the wordmark when the brand name has one word", () => {
    const { container } = render(<MatissLockup brandName="Matiss" />);

    expect(screen.getByText("Matiss")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-lockup-part]")).toHaveLength(1);
  });

  it("hides the drawn mark from assistive technology", () => {
    const { container } = render(<MatissLockup brandName="Matiss Studio" />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
