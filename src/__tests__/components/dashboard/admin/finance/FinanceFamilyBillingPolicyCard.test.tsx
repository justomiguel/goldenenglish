import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinanceFamilyBillingPolicyCard } from "@/components/dashboard/admin/finance/FinanceFamilyBillingPolicyCard";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/finance/billingSettingsActions", () => ({
  setFamilyBillingPolicyAction: vi.fn(),
}));

const dict = dictEn.admin.finance.settings;

describe("FinanceFamilyBillingPolicyCard", () => {
  it("renders both family checkout toggles from the dictionary", () => {
    render(
      <FinanceFamilyBillingPolicyCard
        locale="en"
        initial={{ creditPaidTrialOnEnroll: true, allowParentPartialSectionPayments: true }}
        dict={dict}
      />,
    );
    expect(screen.getByText(dict.familyBillingTitle)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: new RegExp(dict.familyBillingTrialCreditToggle) })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: new RegExp(dict.familyBillingPartialToggle) })).toBeChecked();
  });
});
