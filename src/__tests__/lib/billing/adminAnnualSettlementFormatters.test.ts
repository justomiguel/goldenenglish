import { describe, expect, it } from "vitest";
import { formatAnnualSettlementExistingLine } from "@/components/dashboard/adminAnnualSettlementFormatters";
import type { AdminBillingAnnualSettlement } from "@/types/adminStudentBilling";
import type { Dictionary } from "@/types/i18n";
import en from "@/dictionaries/en.json";

describe("formatAnnualSettlementExistingLine", () => {
  const labels = en.admin.billing.annualSettlement as Dictionary["admin"]["billing"]["annualSettlement"];
  const settlement: AdminBillingAnnualSettlement = {
    id: "x",
    coverageFromYear: 2026,
    coverageFromMonth: 1,
    coverageUntilYear: 2026,
    coverageUntilMonth: 12,
    includesEnrollmentFee: true,
    baselineListTotal: 1000,
    acceptedTotal: 900,
    impliedDiscountAmount: 100,
    currency: "USD",
    createdAt: "",
  };

  it("formats list line with fee hint", () => {
    const line = formatAnnualSettlementExistingLine({
      settlement,
      labels,
      formatMoney: (n, cur) => `${cur}${n}`,
    });
    expect(line).toContain("2026");
    expect(line).toContain(labels.feeIncluded);
  });
});
