import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherAttendanceMatrixGridRow } from "@/components/organisms/TeacherAttendanceMatrixGridRow";
import { dictEn } from "@/test/dictEn";

const dict = dictEn.dashboard.teacherSectionAttendance.matrix;

function renderRow(hasCareNotes: boolean) {
  return render(
    <table>
      <tbody>
        <TeacherAttendanceMatrixGridRow
          row={{
            enrollmentId: "e1",
            studentLabel: "Ruiz Ana",
            enrollmentStatus: "active",
            createdAt: "2026-03-01T00:00:00.000Z",
            updatedAt: "2026-03-01T00:00:00.000Z",
            hasCareNotes,
          }}
          classDays={["2026-03-01"]}
          cells={{ e1: { "2026-03-01": null } }}
          todayIso="2026-03-01"
          focused={null}
          onFocusChange={vi.fn()}
          onCellStatus={vi.fn()}
          matrixMode="teacher"
          isDateEditable={() => true}
          wrapRef={createRef<HTMLDivElement>()}
          dict={dict}
        />
      </tbody>
    </table>,
  );
}

describe("TeacherAttendanceMatrixGridRow care badge", () => {
  it("marks a student who needs care", () => {
    renderRow(true);
    expect(screen.getByLabelText(dict.careBadge)).toBeInTheDocument();
  });

  it("shows nothing for a student who does not", () => {
    renderRow(false);
    expect(screen.queryByLabelText(dict.careBadge)).not.toBeInTheDocument();
  });

  it("keeps the row header readable, since it is the grid's row label", () => {
    renderRow(true);
    expect(screen.getByRole("rowheader")).toHaveTextContent("Ruiz Ana");
  });
});
