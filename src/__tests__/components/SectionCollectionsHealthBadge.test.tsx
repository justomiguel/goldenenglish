import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionCollectionsHealthBadge } from "@/components/dashboard/admin/finance/SectionCollectionsHealthBadge";
import { dictEn } from "@/test/dictEn";

const dict = dictEn.admin.finance.collections;

describe("SectionCollectionsHealthBadge", () => {
  it("renders the healthy label and tooltip", () => {
    render(<SectionCollectionsHealthBadge health="healthy" dict={dict} />);
    const node = screen.getByRole("status");
    expect(node).toHaveTextContent(dict.health.healthy);
    expect(node.title).toBe(`${dict.health.healthy}: ${dict.health.tooltipHealthy}`);
    expect(node).toHaveAccessibleName(
      `${dict.health.ariaLabel}: ${dict.health.healthy}. ${dict.health.tooltipHealthy}`,
    );
  });

  it("renders critical with the correct tooltip", () => {
    render(<SectionCollectionsHealthBadge health="critical" dict={dict} />);
    const node = screen.getByRole("status");
    expect(node).toHaveTextContent(dict.health.critical);
    expect(node.title).toBe(`${dict.health.critical}: ${dict.health.tooltipCritical}`);
  });

  it("renders watch with the correct tooltip", () => {
    render(<SectionCollectionsHealthBadge health="watch" dict={dict} />);
    expect(screen.getByRole("status").title).toBe(
      `${dict.health.watch}: ${dict.health.tooltipWatch}`,
    );
  });
});
