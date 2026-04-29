import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { FinanceInboxClient } from "@/components/dashboard/admin/finance/FinanceInboxClient";
import type {
  MonthlyReceiptItem,
  EnrollmentReceiptItem,
  InvoiceReceiptItem,
} from "@/components/dashboard/admin/finance/FinanceInboxPanel";

const dict = dictEn;
const inboxDict = dict.admin.finance.inbox;

const monthlyItems: MonthlyReceiptItem[] = [
  {
    id: "pay-1",
    studentName: "Smith Ana",
    periodLabel: "3/2026",
    amount: 100,
    signedUrl: null,
    studentId: "stu-1",
    uploadedAt: new Date().toISOString(),
  },
];

const enrollmentItems: EnrollmentReceiptItem[] = [
  {
    enrollmentId: "enr-1",
    studentId: "stu-2",
    studentName: "Lopez Zara",
    sectionName: "Section B",
    signedUrl: null,
    uploadedAt: new Date().toISOString(),
  },
];

const invoiceItems: InvoiceReceiptItem[] = [
  {
    receiptId: "rec-1",
    invoiceDescription: "March invoice",
    amountPaid: 250,
    studentName: "Garcia Leo",
    createdAt: new Date().toISOString(),
    receiptHref: "/en/dashboard/admin/finance/receipts/rec-1",
  },
];

describe("FinanceInboxClient", () => {
  it("renders the segmented control with badge counts for each type", () => {
    render(
      <FinanceInboxClient
        monthlyItems={monthlyItems}
        enrollmentItems={enrollmentItems}
        invoiceItems={invoiceItems}
        locale="en"
        dict={dict}
      />,
    );
    expect(
      screen.getByRole("button", { name: new RegExp(inboxDict.typeMonthly) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(inboxDict.typeEnrollment) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(inboxDict.typeInvoice) }),
    ).toBeInTheDocument();
  });

  it("defaults to monthly tab and shows monthly items", () => {
    render(
      <FinanceInboxClient
        monthlyItems={monthlyItems}
        enrollmentItems={enrollmentItems}
        invoiceItems={invoiceItems}
        locale="en"
        dict={dict}
      />,
    );
    expect(screen.getByText("Smith Ana")).toBeInTheDocument();
    expect(screen.queryByText("Lopez Zara")).not.toBeInTheDocument();
  });

  it("switches to enrollment tab on click", async () => {
    render(
      <FinanceInboxClient
        monthlyItems={monthlyItems}
        enrollmentItems={enrollmentItems}
        invoiceItems={invoiceItems}
        locale="en"
        dict={dict}
      />,
    );
    const btn = screen.getByRole("button", {
      name: new RegExp(inboxDict.typeEnrollment),
    });
    await userEvent.click(btn);
    expect(screen.getByText("Lopez Zara")).toBeInTheDocument();
    expect(screen.queryByText("Smith Ana")).not.toBeInTheDocument();
  });

  it("shows invoice items when invoice tab is active", async () => {
    render(
      <FinanceInboxClient
        monthlyItems={monthlyItems}
        enrollmentItems={enrollmentItems}
        invoiceItems={invoiceItems}
        locale="en"
        dict={dict}
      />,
    );
    const btn = screen.getByRole("button", {
      name: new RegExp(inboxDict.typeInvoice),
    });
    await userEvent.click(btn);
    expect(screen.getByText("Garcia Leo")).toBeInTheDocument();
    expect(screen.getByText("March invoice")).toBeInTheDocument();
  });

  it("shows empty state when a category has no items", async () => {
    render(
      <FinanceInboxClient
        monthlyItems={[]}
        enrollmentItems={[]}
        invoiceItems={[]}
        locale="en"
        dict={dict}
      />,
    );
    expect(screen.getByText(inboxDict.empty)).toBeInTheDocument();
  });
});
