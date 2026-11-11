import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminUserAcademicPanel } from "@/components/molecules/AdminUserAcademicPanel";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { StudentFichaCohortEnrollment } from "@/lib/dashboard/studentFichaCohort";
import { dictEn } from "@/test/dictEn";

vi.mock("@/components/molecules/AdminStudentCurrentCohortAssignmentCard", () => ({
  AdminStudentCurrentCohortAssignmentCard: () => <div>Assign section</div>,
}));

vi.mock("@/components/molecules/AdminUserInlineEditableField", () => ({
  AdminUserInlineEditableField: () => null,
}));

vi.mock("@/components/molecules/AdminAcademicProfileFields", () => ({
  AdminAcademicProfileFields: () => null,
}));

vi.mock("@/components/molecules/AdminStudentAcademicExams", () => ({
  AdminStudentAcademicExams: () => null,
}));

vi.mock("@/components/molecules/AdminStudentAcademicNotes", () => ({
  AdminStudentAcademicNotes: () => null,
}));

const currentRow: StudentFichaCohortEnrollment = {
  enrollmentId: "enr-now",
  cohortId: "cohort-now",
  cohortName: "2026",
  isCurrent: true,
  sectionId: "sec-now",
  sectionName: "Current section",
  status: "active",
  createdAt: "2026-03-01T00:00:00Z",
  teacher: { id: "teacher-now", name: "Paz Luis" },
  assistants: [],
};

const pastRow: StudentFichaCohortEnrollment = {
  enrollmentId: "enr-past",
  cohortId: "cohort-past",
  cohortName: "2024",
  isCurrent: false,
  sectionId: "sec-past",
  sectionName: "Past section",
  status: "completed",
  createdAt: "2024-03-01T00:00:00Z",
  teacher: { id: "teacher-past", name: "Ruiz Ana" },
  assistants: [],
};

function detailFor(rows: StudentFichaCohortEnrollment[], listCode: string | null = null): AdminUserDetailVM {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    role: "student",
    cohortEnrollments: rows,
    cohortListCode: listCode,
    academicExams: [],
    academicNotes: [],
    currentCohortAssignment: {
      cohortId: "cohort-now",
      cohortName: "2026",
      sections: [],
      current: null,
      currentSections: [],
      hasMultipleCurrentAssignments: false,
    },
  } as AdminUserDetailVM;
}

function Panel({ detail }: { detail: AdminUserDetailVM }) {
  const [cohortId, setCohortId] = useState("cohort-now");
  return (
    <AdminUserAcademicPanel
      locale="en"
      detail={detail}
      labels={dictEn.admin.users}
      editable={false}
      roleLabel="Student"
      roleOptions={[]}
      onFeedback={vi.fn()}
      selectedCohortId={cohortId}
      onCohortChange={setCohortId}
    />
  );
}

describe("AdminUserAcademicPanel", () => {
  it("shows the past section and teacher and hides the assignment form", async () => {
    const user = userEvent.setup();
    render(<Panel detail={detailFor([currentRow, pastRow])} />);

    expect(screen.getByText("Assign section")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(dictEn.admin.users.detailCohortSelect), "cohort-past");

    expect(screen.getByText("Past section")).toBeInTheDocument();
    expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
    expect(screen.queryByText("Assign section")).not.toBeInTheDocument();
  });

  it("shows the cohort list failure code", () => {
    render(<Panel detail={detailFor([], "cohort_list_failed")} />);

    expect(screen.getByText(/cohort_list_failed/)).toBeInTheDocument();
  });
});
