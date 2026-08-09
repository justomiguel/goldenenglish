import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherRosterStudentRow } from "@/components/molecules/TeacherRosterStudentRow";
import { dictEn } from "@/test/dictEn";

const dict = dictEn.dashboard.teacherMySections;

function renderRow(hasCareNotes: boolean) {
  return render(
    <ul>
      <TeacherRosterStudentRow
        label="Ruiz Ana"
        hasCareNotes={hasCareNotes}
        avatarDisplayUrl={null}
        statusLabel="active"
        showActions={false}
        hasPendingTransfer={false}
        narrow={false}
        dict={dict}
        onOpenContext={vi.fn()}
        onSuggestSection={vi.fn()}
        onSuggestCohort={vi.fn()}
      />
    </ul>,
  );
}

describe("TeacherRosterStudentRow care badge", () => {
  it("marks a student who needs care", () => {
    renderRow(true);
    expect(screen.getByLabelText(dict.careBadge)).toBeInTheDocument();
  });

  it("shows nothing for a student who does not", () => {
    renderRow(false);
    expect(screen.queryByLabelText(dict.careBadge)).not.toBeInTheDocument();
  });

  it("keeps the student's name readable next to the badge", () => {
    renderRow(true);
    expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
  });
});
