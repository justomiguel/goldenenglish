import { describe, it, expect, vi } from "vitest";
import { useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { StudentAttendanceCalendar } from "@/components/student/StudentAttendanceCalendar";
import { StudentAttendanceWeekStrip } from "@/components/student/StudentAttendanceWeekStrip";
import { StudentPaymentsHistory } from "@/components/student/StudentPaymentsHistory";
import { StudentPaymentForm } from "@/components/student/StudentPaymentForm";
import { StudentMessagesClient } from "@/components/student/StudentMessagesClient";
import { TeacherMessagesClient } from "@/components/teacher/TeacherMessagesClient";
import type { AttendanceRow } from "@/lib/attendance/stats";

vi.mock("react-calendar", () => ({
  default: function MockCalendar({
      onChange,
      onActiveStartDateChange,
      tileClassName,
    }: {
      onChange?: (v: Date | Date[]) => void;
      onActiveStartDateChange?: (args: { activeStartDate: Date | null }) => void;
      tileClassName?: (args: { date: Date; view: string }) => string | null;
    }) {
      useEffect(() => {
        const sample = new Date(2026, 2, 10);
        onChange?.(sample);
        onActiveStartDateChange?.({ activeStartDate: new Date(2026, 2, 1) });
        if (tileClassName) {
          tileClassName({ date: new Date(2026, 2, 10), view: "month" });
          tileClassName({ date: new Date(2026, 2, 11), view: "month" });
          tileClassName({ date: new Date(2026, 2, 12), view: "month" });
          tileClassName({ date: sample, view: "year" });
        }
        // Test mock: run once to exercise calendar props.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- stable mock props
      }, []);
      return <div data-testid="react-calendar" />;
    },
}));

vi.mock("react-calendar/dist/Calendar.css", () => ({}));

vi.mock("@/app/[locale]/dashboard/student/payments/actions", () => ({
  submitStudentPaymentReceipt: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/[locale]/dashboard/student/messages/actions", () => ({
  sendStudentMessage: vi.fn().mockResolvedValue({ ok: true }),
  deleteStudentMessage: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/[locale]/dashboard/teacher/messages/actions", () => ({
  replyToStudentMessage: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const rows: AttendanceRow[] = [
  { attendance_date: "2026-03-10", status: "present", is_mandatory: true },
  { attendance_date: "2026-03-11", status: "absent", is_mandatory: true },
  { attendance_date: "2026-03-12", status: "justified", is_mandatory: true },
];

describe("student portal components", () => {
  it("StudentAttendanceCalendar shows month meta, week strip navigation, and mode toggles", async () => {
    const user = userEvent.setup();
    render(<StudentAttendanceCalendar rows={rows} labels={dictEn.dashboard.student} />);
    expect(
      screen.getByRole("region", { name: dictEn.dashboard.student.calendarTitle }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.viewWeek }));
    expect(screen.queryByTestId("react-calendar")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.weekPrev }));
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.weekNext }));
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.viewMonth }));
    expect(screen.getByTestId("react-calendar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.viewWeek }));
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.viewMonth }));
  });

  it("StudentAttendanceWeekStrip shows weekday labels", () => {
    render(
      <StudentAttendanceWeekStrip
        anchorDate={new Date(2026, 2, 10)}
        rowByDate={
          new Map([
            [
              "2026-03-10",
              { attendance_date: "2026-03-10", status: "present", is_mandatory: true },
            ],
          ])
        }
        labels={{
          present: "Present",
          absent: "Absent",
          justified: "Excused",
          noClass: "None",
        }}
      />,
    );
    expect(screen.getAllByText("Present").length).toBeGreaterThan(0);
  });

  it("StudentPaymentsHistory renders table rows", () => {
    render(
      <StudentPaymentsHistory
        rows={[
          {
            id: "1",
            month: 3,
            year: 2026,
            amount: 100,
            displayAmount: 100,
            status: "pending",
            updated_at: new Date().toISOString(),
            receiptSignedUrl: "https://x",
          },
        ]}
        labels={dictEn.dashboard.student}
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.dashboard.student.paymentViewReceipt })).toHaveAttribute(
      "href",
      "https://x",
    );
  });

  it("StudentPaymentForm submits", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <StudentPaymentForm locale="es" labels={dictEn.dashboard.student} />,
    );
    await user.type(screen.getByLabelText(dictEn.dashboard.student.payAmount), "100");
    const file = new File([new Uint8Array([1])], "r.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(dictEn.dashboard.student.payReceipt), file);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    // requestSubmit + required file is flaky in jsdom; fireEvent.submit invokes React onSubmit.
    fireEvent.submit(form!);
    expect(await screen.findByText(dictEn.dashboard.student.paySuccess)).toBeInTheDocument();
  });

  it("StudentMessagesClient lists messages and compose", async () => {
    const user = userEvent.setup();
    render(
      <StudentMessagesClient
        locale="es"
        canCompose
        initialLines={[
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            from_me: true,
            body_html: "<p>Hi</p>",
            created_at: new Date().toISOString(),
            can_delete: true,
            peer_name: "Teacher",
            incoming_label: "Teacher",
          },
        ]}
        labels={dictEn.dashboard.student}
      />,
    );
    expect(screen.getByText("Hi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.student.messagesDelete }));
  });

  it("TeacherMessagesClient shows reply editor when no reply", async () => {
    render(
      <TeacherMessagesClient
        locale="es"
        recipients={[]}
        feedRows={[
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            peerName: "Student A",
            peerRole: "student",
            body_html: "<p>Q</p>",
            created_at: new Date().toISOString(),
            isOutgoing: false,
            canReply: true,
          },
        ]}
        labels={dictEn.dashboard.teacher}
      />,
    );
    expect(screen.getByText(/Student A/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.dashboard.teacher.messagesSendReply })).toBeInTheDocument();
  });
});
