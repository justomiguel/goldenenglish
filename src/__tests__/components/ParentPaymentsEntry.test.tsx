import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { ParentPaymentsEntry } from "@/components/parent/ParentPaymentsEntry";

const stripSpy = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/student/StudentMonthlyPaymentsStrip", () => ({
  StudentMonthlyPaymentsStrip: (props: Record<string, unknown>) => {
    stripSpy(props);
    return <div data-testid="payments-strip" />;
  },
}));

vi.mock("@/components/student/StudentPaymentsHistory", () => ({
  StudentPaymentsHistory: () => <div data-testid="pay-history" />,
}));

vi.mock("@/components/pwa/molecules/PwaPageShell", () => ({
  PwaPageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="pwa-shell">{children}</div>
  ),
}));

vi.mock("@/components/molecules/SurfaceMountGate", () => ({
  SurfaceMountGate: ({
    skeleton,
    desktop,
    narrow,
  }: {
    skeleton: ReactNode;
    desktop: ReactNode;
    narrow: (surface: "web-mobile") => ReactNode;
  }) => (
    <div>
      <div data-testid="sk">{skeleton}</div>
      <div data-testid="desktop">{desktop}</div>
      <div data-testid="narrow">{narrow("web-mobile")}</div>
    </div>
  ),
}));

const labels = dictEn.dashboard.parent;
const studentLabels = dictEn.dashboard.student;

const feesPanel = <div data-testid="fees-panel" />;

describe("ParentPaymentsEntry", () => {
  beforeEach(() => {
    stripSpy.mockClear();
  });

  it("shows the no-linked-students empty state when options is empty", () => {
    render(
      <ParentPaymentsEntry
        locale="en"
        title="Tutor payments"
        lead="Upload receipts on behalf of your students"
        options={[]}
        selectedStudentId={null}
        monthlyView={null}
        payments={[]}
        financialAccessRevoked={false}
        labels={labels}
        studentLabels={studentLabels}
        submitReceiptAction={vi.fn()}
        submitEnrollmentFeeReceiptAction={vi.fn()}
        fileUploadProgress={dictEn.common.fileUpload}
        feesPanel={feesPanel}
      />,
    );
    expect(
      screen.getAllByText(labels.paymentsNoLinkedStudents).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByTestId("payments-strip")).not.toBeInTheDocument();
  });

  it("renders the picker and the strip when access is active", () => {
    render(
      <ParentPaymentsEntry
        locale="en"
        title="Tutor payments"
        lead="Upload receipts"
        options={[
          { studentId: "stu-1", displayName: "Ana Lopez", financialAccessActive: true },
          { studentId: "stu-2", displayName: "Bruno Diaz", financialAccessActive: true },
        ]}
        selectedStudentId="stu-1"
        monthlyView={{ todayMonth: 1, todayYear: 2026, rows: [] }}
        payments={[]}
        financialAccessRevoked={false}
        labels={labels}
        studentLabels={studentLabels}
        submitReceiptAction={vi.fn()}
        submitEnrollmentFeeReceiptAction={vi.fn()}
        fileUploadProgress={dictEn.common.fileUpload}
        feesPanel={feesPanel}
      />,
    );
    expect(screen.getAllByLabelText(labels.paymentsPickerLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("payments-strip").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("tablist", { name: studentLabels.paymentsScreenTabsAria }).length).toBe(
      2,
    );
    expect(
      screen.getAllByRole("tab", { name: studentLabels.paymentsTabOverview }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId("pay-history").length).toBeGreaterThan(0);
    expect(stripSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptExpectedUsesFullMonth: true,
        tutorPaymentMethodTabs: true,
      }),
    );
  });

  it("renders the access-revoked banner instead of the strip when student opted out", () => {
    render(
      <ParentPaymentsEntry
        locale="en"
        title="Tutor payments"
        lead="Upload receipts"
        options={[
          { studentId: "stu-1", displayName: "Ana Lopez", financialAccessActive: false },
        ]}
        selectedStudentId="stu-1"
        monthlyView={null}
        payments={[]}
        financialAccessRevoked={true}
        labels={labels}
        studentLabels={studentLabels}
        submitReceiptAction={vi.fn()}
        submitEnrollmentFeeReceiptAction={vi.fn()}
        fileUploadProgress={dictEn.common.fileUpload}
        feesPanel={feesPanel}
      />,
    );
    expect(
      screen.getAllByText(labels.paymentsAccessRevokedTitle).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByTestId("payments-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pay-history")).not.toBeInTheDocument();
  });
});
