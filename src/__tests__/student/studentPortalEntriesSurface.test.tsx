import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { StudentPaymentsEntry } from "@/components/student/StudentPaymentsEntry";
import { StudentMessagesEntry } from "@/components/student/StudentMessagesEntry";
import { TeacherMessagesEntry } from "@/components/teacher/TeacherMessagesEntry";

vi.mock("@/components/student/StudentMonthlyPaymentsStrip", () => ({
  StudentMonthlyPaymentsStrip: () => <div data-testid="payments-strip" />,
}));

vi.mock("@/components/molecules/PromotionApplyForm", () => ({
  PromotionApplyForm: () => <div data-testid="promo-apply" />,
}));

vi.mock("@/components/molecules/PromotionAppliedBadge", () => ({
  PromotionAppliedBadge: () => <div data-testid="promo-badge" />,
}));

vi.mock("@/components/student/StudentPaymentsHistory", () => ({
  StudentPaymentsHistory: () => <div data-testid="pay-history" />,
}));

vi.mock("@/components/student/StudentMessagesClient", () => ({
  StudentMessagesClient: () => <div data-testid="student-messages" />,
}));

vi.mock("@/components/teacher/TeacherMessagesClient", () => ({
  TeacherMessagesClient: () => <div data-testid="teacher-messages" />,
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

describe("student portal entries — SurfaceMountGate branches", () => {
  it("StudentPaymentsEntry exposes skeleton, desktop, narrow, and monthly payments strip", () => {
    render(
      <StudentPaymentsEntry
        locale="en"
        studentId="00000000-0000-0000-0000-000000000001"
        hasPromotionApplied={false}
        title="Payments"
        lead="Upload receipts"
        payments={[]}
        monthlyView={{ todayMonth: 1, todayYear: 2026, rows: [] }}
        labels={dictEn.dashboard.student}
        submitReceiptAction={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getByTestId("desktop")).toBeInTheDocument();
    expect(screen.getByTestId("narrow")).toBeInTheDocument();
    expect(screen.getAllByTestId("payments-strip")).toHaveLength(2);
    expect(screen.getAllByTestId("pay-history")).toHaveLength(2);
    expect(screen.getAllByTestId("pwa-shell")).toHaveLength(1);
  });

  it("StudentPaymentsEntry shows tutor-managed empty state when blocked", () => {
    render(
      <StudentPaymentsEntry
        locale="en"
        studentId="00000000-0000-0000-0000-000000000001"
        hasPromotionApplied={false}
        title="Payments"
        lead="Upload receipts"
        payments={[]}
        monthlyView={null}
        labels={dictEn.dashboard.student}
        paymentsBlockedMessage="Managed by tutor"
        submitReceiptAction={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Managed by tutor")).toHaveLength(2);
    expect(screen.queryByTestId("payments-strip")).not.toBeInTheDocument();
  });

  it("StudentMessagesEntry exposes skeleton, desktop, narrow, and messages client", () => {
    render(
      <StudentMessagesEntry
        locale="es"
        title="Messages"
        lead="Contact your teacher"
        messages={[]}
        labels={dictEn.dashboard.student}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getAllByTestId("student-messages")).toHaveLength(2);
  });

  it("TeacherMessagesEntry exposes skeleton, desktop, narrow, and messages client", () => {
    render(
      <TeacherMessagesEntry
        locale="es"
        title="Inbox"
        lead="Student questions"
        messages={[]}
        labels={dictEn.dashboard.teacher}
      />,
    );
    expect(screen.getByTestId("sk")).toBeInTheDocument();
    expect(screen.getAllByTestId("teacher-messages")).toHaveLength(2);
  });
});
