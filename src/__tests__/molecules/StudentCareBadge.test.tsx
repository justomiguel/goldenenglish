import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentCareBadge } from "@/components/molecules/StudentCareBadge";

const LABEL = "Requiere atención especial";

describe("StudentCareBadge", () => {
  it("exposes the label as its accessible name", () => {
    render(<StudentCareBadge label={LABEL} />);
    expect(screen.getByLabelText(LABEL)).toBeInTheDocument();
  });

  it("also sets the label as a tooltip, since the icon means nothing on its own", () => {
    const { container } = render(<StudentCareBadge label={LABEL} />);
    expect(container.querySelector(`[title="${LABEL}"]`)).not.toBeNull();
  });

  it("says only that care exists, never what it is", () => {
    // The component takes no note text at all; this test exists to keep it that
    // way, because a badge is shown to people who may not read the detail.
    const { container } = render(<StudentCareBadge label={LABEL} />);
    expect(container.textContent).toBe("");
  });
});
