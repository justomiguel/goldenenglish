import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentPaymentsFamilyHero } from "@/components/pwa/molecules/ParentPaymentsFamilyHero";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.dashboard.parent.paymentsPwa;

describe("ParentPaymentsFamilyHero", () => {
  it("shows the total of unpaid fees", () => {
    render(
      <ParentPaymentsFamilyHero locale="en" labels={labels} unpaidFeesTotal={180} />,
    );

    expect(screen.getByText(labels.familyTotalLabel)).toBeInTheDocument();
    expect(screen.getByText("$180")).toBeInTheDocument();
    expect(screen.getByText(labels.familyTotalHint)).toBeInTheDocument();
    expect(screen.queryByText(labels.settledBanner.replace("{year}", "2026"))).not.toBeInTheDocument();
  });

  it("renders nothing when there are no unpaid fees", () => {
    const { container } = render(
      <ParentPaymentsFamilyHero locale="en" labels={labels} unpaidFeesTotal={0} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(labels.familyTotalLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.settledBanner.replace("{year}", "2026"))).not.toBeInTheDocument();
  });
});
