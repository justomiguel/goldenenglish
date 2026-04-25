import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import {
  FinanceHubTabs,
  FINANCE_HUB_TAB_ORDER,
  parseFinanceHubTab,
} from "@/components/dashboard/admin/finance/FinanceHubTabs";

const hubDict = dictEn.admin.finance.hub;
const baseHref = "/en/dashboard/admin/finance";

describe("parseFinanceHubTab", () => {
  it("falls back to overview when missing or unknown", () => {
    expect(parseFinanceHubTab(undefined)).toBe("overview");
    expect(parseFinanceHubTab("")).toBe("overview");
    expect(parseFinanceHubTab("nope")).toBe("overview");
  });

  it("accepts every allowed tab id verbatim", () => {
    for (const tab of FINANCE_HUB_TAB_ORDER) {
      expect(parseFinanceHubTab(tab)).toBe(tab);
    }
    expect(parseFinanceHubTab("collections")).toBe("overview");
    expect(parseFinanceHubTab("receipts")).toBe("overview");
  });
});

describe("FinanceHubTabs", () => {
  it("renders one link per tab and marks the current one with aria-current", () => {
    render(
      <FinanceHubTabs current="payments" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );

    for (const tab of FINANCE_HUB_TAB_ORDER) {
      expect(
        screen.getByRole("link", { name: hubDict.tabs[tab] }),
      ).toBeInTheDocument();
    }
    const active = screen.getByRole("link", {
      name: hubDict.tabs.payments,
    });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute(
      "href",
      `${baseHref}?tab=payments`,
    );
    expect(screen.queryByRole("link", { name: hubDict.tabs.collections })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: hubDict.tabs.receipts })).not.toBeInTheDocument();
  });

  it("preserves cohort and year query across tab switches", () => {
    render(
      <FinanceHubTabs
        current="overview"
        baseHref={baseHref}
        preservedQuery={{ cohort: "co-1", year: "2026" }}
        dict={hubDict}
      >
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    const link = screen.getByRole("link", { name: hubDict.tabs.payments });
    const href = link.getAttribute("href")!;
    expect(href.startsWith(`${baseHref}?`)).toBe(true);
    expect(href).toContain("tab=payments");
    expect(href).toContain("cohort=co-1");
    expect(href).toContain("year=2026");
  });

  it("renders the panel children inside the tab navigation wrapper", () => {
    render(
      <FinanceHubTabs current="overview" baseHref={baseHref} dict={hubDict}>
        <p data-testid="finance-panel">panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByTestId("finance-panel")).toBeInTheDocument();
  });

  it("surfaces pending counts only on visible payments tab", () => {
    render(
      <FinanceHubTabs
        current="overview"
        baseHref={baseHref}
        pendingCounts={{ receipts: 3, payments: 7 }}
        dict={hubDict}
      >
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.queryByText("3")).not.toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    // overview never gets a numeric badge.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("clamps very large pending counts to '99+'", () => {
    render(
      <FinanceHubTabs
        current="overview"
        baseHref={baseHref}
        pendingCounts={{ payments: 250 }}
        dict={hubDict}
      >
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows the active tab's tooltip text as a contextual subtitle", () => {
    render(
      <FinanceHubTabs current="payments" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByText(hubDict.tipPayments)).toBeInTheDocument();
  });
});
