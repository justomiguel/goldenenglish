import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatissSeal } from "@/variants/owned/matiss/seal/v1/Web";

const ring = "Gimnasia acrobática · San Miguel · La Florida ·";

describe("MatissSeal", () => {
  it("shows the brand logo with its alt text and the ring text", () => {
    render(<MatissSeal ring={ring} logoSrc="/images/matiss/logo/logo.png" logoAlt="Matiss Studio" size="lg" />);

    expect(screen.getByRole("img", { name: "Matiss Studio" })).toHaveAttribute(
      "src",
      expect.stringContaining("logo.png"),
    );
    expect(screen.getByText(ring)).toBeInTheDocument();
  });

  it("is decorative when no alt text is given", () => {
    const { container } = render(<MatissSeal ring={ring} logoSrc="/images/matiss/logo/logo.png" size="md" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("gives every ring path its own id", () => {
    const { container } = render(
      <>
        <MatissSeal ring={ring} logoSrc="/l.png" size="md" />
        <MatissSeal ring={ring} logoSrc="/l.png" size="sm" />
      </>,
    );

    const ids = Array.from(container.querySelectorAll("path[id]")).map((path) => path.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
