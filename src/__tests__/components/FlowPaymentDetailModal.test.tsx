import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { FlowPaymentDetailModal } from "@/components/dashboard/admin/finance/FlowPaymentDetailModal";
import type { SectionCollectionsFlowFinalizeSummary } from "@/types/sectionCollectionsTabs";

const baseFinalize: SectionCollectionsFlowFinalizeSummary = {
  flowOrder: 12345,
  commerceOrder: "MES-2026-05-00000007",
  currency: "CLP",
  amount: 12500,
  paidAt: "2026-05-10T20:30:00.000Z",
  payerEmail: "parent@example.com",
  mediaLabel: "Webpay",
  fee: 380,
  balance: 12120,
  transferDate: "2026-05-12T00:00:00.000Z",
  conversionRate: null,
  conversionDate: null,
};

const tabsDict = dictEn.admin.finance.collections.sectionTabs;

describe("FlowPaymentDetailModal", () => {
  it("renders Flow finalize fields including fee and balance", () => {
    render(
      <FlowPaymentDetailModal
        open
        onClose={() => undefined}
        locale="en"
        dict={tabsDict}
        studentDisplayName="Pérez, Ana"
        periodLabel="05/2026"
        finalize={baseFinalize}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: new RegExp(tabsDict.historyFlowDetailTitle, "i"),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(tabsDict.historyFlowDetailFlowOrder)).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("MES-2026-05-00000007")).toBeInTheDocument();
    expect(screen.getByText("Webpay")).toBeInTheDocument();
    expect(screen.getByText("parent@example.com")).toBeInTheDocument();
    /** Currency formatting depends on Intl; assert the numeric portion is present. */
    expect(screen.getByText(/380/)).toBeInTheDocument();
    expect(screen.getByText(/12,120|12.120/)).toBeInTheDocument();
  });

  it("falls back to em-dash for fields Flow omitted and shows the missing-fee notice when fee is null", () => {
    render(
      <FlowPaymentDetailModal
        open
        onClose={() => undefined}
        locale="en"
        dict={tabsDict}
        studentDisplayName="Pérez, Ana"
        periodLabel="05/2026"
        finalize={{ ...baseFinalize, fee: null, balance: null, payerEmail: null, mediaLabel: null }}
      />,
    );

    expect(screen.getByText(tabsDict.historyFlowDetailMissingFee)).toBeInTheDocument();
    /** Multiple `—` cells expected for missing fields (payer/media/fee/balance). */
    expect(screen.getAllByText(tabsDict.historyFlowDetailEmptyValue).length).toBeGreaterThanOrEqual(2);
  });

  it("invokes onClose when Close button is pressed", async () => {
    const onClose = vi.fn();
    render(
      <FlowPaymentDetailModal
        open
        onClose={onClose}
        locale="en"
        dict={tabsDict}
        studentDisplayName="Pérez, Ana"
        periodLabel="05/2026"
        finalize={baseFinalize}
      />,
    );
    /** Modal exposes the explicit Cerrar/Close button at the bottom; click it. */
    const closeButton = screen.getByRole("button", { name: tabsDict.historyFlowDetailClose });
    closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
