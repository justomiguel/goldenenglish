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
  // REGRESSION CHECK: Default tab drives finance hub SSR query cost (matrix load rules).
  it("defaults to collections when missing or unknown", () => {
    expect(parseFinanceHubTab(undefined)).toBe("collections");
    expect(parseFinanceHubTab("")).toBe("collections");
    expect(parseFinanceHubTab("nope")).toBe("collections");
  });

  it("maps deprecated overview links to collections", () => {
    expect(parseFinanceHubTab("overview")).toBe("collections");
  });

  it("accepts every allowed tab id verbatim", () => {
    for (const tab of FINANCE_HUB_TAB_ORDER) {
      expect(parseFinanceHubTab(tab)).toBe(tab);
    }
  });

  it("maps legacy hub tab ids removed earlier to collections", () => {
    expect(parseFinanceHubTab("payments")).toBe("collections");
    expect(parseFinanceHubTab("receipts")).toBe("collections");
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

  it("renders exactly four tabs (collections, inbox, insights, settings)", () => {
    render(
      <FinanceHubTabs current="collections" baseHref={baseHref} dict={hubDict}>
        <p>panel-content</p>
      </FinanceHubTabs>,
    );
    expect(FINANCE_HUB_TAB_ORDER).toHaveLength(4);
    expect(FINANCE_HUB_TAB_ORDER).toEqual([
      "collections",
      "inbox",
      "insights",
      "settings",
    ]);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("preserves cohort and year query across tab switches", () => {
    render(
      <FinanceHubTabs
        current="collections"
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
      <FinanceHubTabs current="collections" baseHref={baseHref} dict={hubDict}>
        <p data-testid="finance-panel">panel-content</p>
      </FinanceHubTabs>,
    );
    expect(screen.getByTestId("finance-panel")).toBeInTheDocument();
  });

  it("surfaces pending counts on the inbox tab", () => {
    render(
      <FinanceHubTabs
        current="collections"
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
        current="collections"
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
        current="collections"
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
