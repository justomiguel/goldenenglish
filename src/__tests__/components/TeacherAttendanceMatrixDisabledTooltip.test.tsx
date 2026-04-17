import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherAttendanceMatrixTable } from "@/components/organisms/TeacherAttendanceMatrixTable";
import enDict from "@/dictionaries/en.json";

const dict = enDict.dashboard.teacherSectionAttendance.matrix;

const baseRow = {
  enrollmentId: "enr-1",
  studentLabel: "Ada Lovelace",
  enrollmentStatus: "active",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
};

describe("TeacherAttendanceMatrixTable disabled-cell tooltips (teacher)", () => {
  it("explains an excused (E) cell with the read-only tooltip in teacher mode", () => {
    render(
      <TeacherAttendanceMatrixTable
        locale="en"
        rows={[baseRow]}
        classDays={["2026-04-17"]}
        cells={{ "enr-1": { "2026-04-17": "excused" } }}
        editableByDate={{ "2026-04-17": true }}
        todayIso="2026-04-17"
        holidayLabels={{}}
        focused={null}
        onFocusChange={vi.fn()}
        onCellStatus={vi.fn()}
        dict={dict}
        matrixMode="teacher"
      />,
    );
    const btn = screen.getByLabelText(/Ada Lovelace.*2026-04-17/);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", dict.cellDisabledExcused);
  });

  it("explains a row of a dropped student with the inactive tooltip in teacher mode", () => {
    render(
      <TeacherAttendanceMatrixTable
        locale="en"
        rows={[{ ...baseRow, enrollmentStatus: "dropped", updatedAt: "2026-05-01T00:00:00Z" }]}
        classDays={["2026-04-17"]}
        cells={{ "enr-1": { "2026-04-17": null } }}
        editableByDate={{ "2026-04-17": true }}
        todayIso="2026-04-17"
        holidayLabels={{}}
        focused={null}
        onFocusChange={vi.fn()}
        onCellStatus={vi.fn()}
        dict={dict}
        matrixMode="teacher"
      />,
    );
    const btn = screen.getByLabelText(/Ada Lovelace.*2026-04-17/);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", dict.cellDisabledInactive);
  });

  it("uses the past-day tooltip when the column itself is not editable for the teacher", () => {
    render(
      <TeacherAttendanceMatrixTable
        locale="en"
        rows={[baseRow]}
        classDays={["2026-04-10"]}
        cells={{ "enr-1": { "2026-04-10": null } }}
        editableByDate={{ "2026-04-10": false }}
        todayIso="2026-04-17"
        holidayLabels={{}}
        focused={null}
        onFocusChange={vi.fn()}
        onCellStatus={vi.fn()}
        dict={dict}
        matrixMode="teacher"
      />,
    );
    const btn = screen.getByLabelText(/Ada Lovelace.*2026-04-10/);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", dict.cellDisabledPast);
  });

  it("renders a disabled button with the not-enrolled-on-date tooltip when the cell is not navigable", () => {
    render(
      <TeacherAttendanceMatrixTable
        locale="en"
        rows={[baseRow]}
        classDays={["2026-04-10", "2026-04-17"]}
        // Only 2026-04-17 has a cell entry; 2026-04-10 is "not enrolled on date".
        cells={{ "enr-1": { "2026-04-17": null } }}
        editableByDate={{ "2026-04-10": true, "2026-04-17": true }}
        todayIso="2026-04-17"
        holidayLabels={{}}
        focused={null}
        onFocusChange={vi.fn()}
        onCellStatus={vi.fn()}
        dict={dict}
        matrixMode="teacher"
      />,
    );
    const btn = screen.getByLabelText(/Ada Lovelace.*2026-04-10/);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", dict.cellDisabledNotEnrolledOnDate);
    expect(btn).toHaveAttribute("data-att-disabled-reason", "not_enrolled_on_date");
  });

  it("does not block excused cells for admin mode (admins can override)", () => {
    render(
      <TeacherAttendanceMatrixTable
        locale="en"
        rows={[baseRow]}
        classDays={["2026-04-17"]}
        cells={{ "enr-1": { "2026-04-17": "excused" } }}
        editableByDate={{ "2026-04-17": true }}
        todayIso="2026-04-17"
        holidayLabels={{}}
        focused={null}
        onFocusChange={vi.fn()}
        onCellStatus={vi.fn()}
        dict={dict}
        matrixMode="admin"
      />,
    );
    const btn = screen.getByLabelText(/Ada Lovelace.*2026-04-17/);
    expect(btn).not.toBeDisabled();
  });
});
