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
  });

  it("rejects legacy tab ids that are no longer in the order", () => {
    expect(parseFinanceHubTab("payments")).toBe("overview");
    expect(parseFinanceHubTab("receipts")).toBe("overview");
  });
});

describe("FinanceHubTabs", () => {
  it("renders one link per tab and marks the current one with aria-current", () => {
    render(
      <FinanceHubTabs current="inbox" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );

    for (const tab of FINANCE_HUB_TAB_ORDER) {
      expect(
        screen.getByRole("link", { name: hubDict.tabs[tab] }),
      ).toBeInTheDocument();
    }
    const active = screen.getByRole("link", {
      name: hubDict.tabs.inbox,
    });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute(
      "href",
      `${baseHref}?tab=inbox`,
    );
  });

  it("renders exactly four tabs (overview, collections, inbox, insights)", () => {
    render(
      <FinanceHubTabs current="overview" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(FINANCE_HUB_TAB_ORDER).toHaveLength(4);
    expect(FINANCE_HUB_TAB_ORDER).toEqual(["overview", "collections", "inbox", "insights"]);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
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
    const link = screen.getByRole("link", { name: hubDict.tabs.inbox });
    const href = link.getAttribute("href")!;
    expect(href.startsWith(`${baseHref}?`)).toBe(true);
    expect(href).toContain("tab=inbox");
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

  it("surfaces pending counts on the inbox tab", () => {
    render(
      <FinanceHubTabs
        current="overview"
        baseHref={baseHref}
        pendingCounts={{ payments: 7 }}
        dict={hubDict}
      >
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByText("7")).toBeInTheDocument();
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
      <FinanceHubTabs current="inbox" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByText(hubDict.tipInbox)).toBeInTheDocument();
  });

  it("renders cohortSelector and kpiStrip slots when provided", () => {
    render(
      <FinanceHubTabs
        current="overview"
        baseHref={baseHref}
        dict={hubDict}
        cohortSelector={<div data-testid="selector">selector</div>}
        kpiStrip={<div data-testid="kpi-strip">kpis</div>}
      >
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByTestId("selector")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-strip")).toBeInTheDocument();
  });
});
