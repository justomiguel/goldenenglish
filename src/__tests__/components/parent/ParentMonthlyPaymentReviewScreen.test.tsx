import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentMonthlyPaymentReviewScreen } from "@/components/parent/ParentMonthlyPaymentReviewScreen";
import { dictEn } from "@/test/dictEn";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const review = dictEn.dashboard.parent.paymentsReview;
const student = dictEn.dashboard.student;

const line = (id: string, name: string, amount: number): PayableParentMonthLine => ({
  sectionId: id,
  sectionName: name,
  amount,
  currency: "CLP",
  scholarshipDiscountPercent: null,
});

const baseProps = {
  locale: "en" as const,
  studentId: "stu-1",
  originSectionId: "sec-a",
  originSectionName: "Piano",
  month: 5,
  year: 2026,
  studentName: "Ana Lopez",
  backHref: "/en/dashboard/parent/payments?studentId=stu-1&sectionId=sec-a",
  reviewHrefBase: "/en/dashboard/parent/payments/review?studentId=stu-1&sectionId=sec-a&month=5&year=2026",
  labels: review,
  studentLabels: student,
  fileUploadProgress: dictEn.common.fileUpload,
  bankTransferInstructions: null,
  enabledOnlineGateways: [] as const,
  submitReceiptAction: vi.fn(),
};

describe("ParentMonthlyPaymentReviewScreen", () => {
  it("hides the scope radios when only one section is payable", () => {
    render(
      <ParentMonthlyPaymentReviewScreen
        {...baseProps}
        scope="current"
        currentLines={[line("sec-a", "Piano", 120)]}
        allLines={[line("sec-a", "Piano", 120)]}
      />,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByText("Piano")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: review.back })).toHaveAttribute(
      "href",
      baseProps.backHref,
    );
  });

  it("shows scope radios and the all-scope total when two sections are payable", () => {
    render(
      <ParentMonthlyPaymentReviewScreen
        {...baseProps}
        scope="all"
        currentLines={[line("sec-a", "Piano", 120)]}
        allLines={[line("sec-a", "Piano", 120), line("sec-b", "Violin", 90)]}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: review.scopeLegend })).toBeInTheDocument();
    expect(screen.getByText("Violin")).toBeInTheDocument();
    expect(screen.getByText(review.total)).toBeInTheDocument();
  });
});
