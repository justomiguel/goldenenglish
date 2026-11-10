import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LioraDancerPose } from "@/components/atoms/LioraDancerPose";

describe("LioraDancerPose", () => {
  it("renders the requested pose as a hidden decoration", () => {
    const { container } = render(<LioraDancerPose pose="grandJete" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-pose", "grandJete");
    expect(container.querySelectorAll("path").length).toBeGreaterThan(3);
  });

  it("falls back to arabesque for an unknown pose", () => {
    const { container } = render(<LioraDancerPose pose="moonwalk" />);
    expect(container.querySelector("svg")).toHaveAttribute("data-pose", "arabesque");
  });

  it("draws a different figure for each pose", () => {
    const a = render(<LioraDancerPose pose="arabesque" />).container.innerHTML;
    const b = render(<LioraDancerPose pose="reverence" />).container.innerHTML;
    expect(a).not.toEqual(b);
  });
});
