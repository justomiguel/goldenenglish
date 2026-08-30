import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminUsersDataTable } from "@/components/dashboard/AdminUsersDataTable";
import { EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS } from "@/lib/dashboard/adminUsersTableHelpers";
import type { AdminUsersDataTableProps } from "@/components/dashboard/AdminUsersDataTable";

function renderTable(overrides: Partial<AdminUsersDataTableProps> = {}) {
  const selectAllRef = createRef<HTMLInputElement>();
  return render(
    <AdminUsersDataTable
      locale="en"
      toolbar={null}
      labels={dictEn.admin.users}
      tableLabels={dictEn.admin.table}
      rows={[]}
      currentUserId="11111111-1111-1111-1111-111111111111"
      sortKey="email"
      sortDir="asc"
      onToggleSort={vi.fn()}
      selectedIds={new Set()}
      onToggleRow={vi.fn()}
      selectAllRef={selectAllRef}
      allVisibleSelected={false}
      onToggleSelectAllVisible={vi.fn()}
      deletableVisibleCount={0}
      busy={false}
      onRequestDeleteOne={vi.fn()}
      emptyMessage="No matches"
      listEmpty
      pagination={{
        page: 1,
        pageSize: 25,
        totalCount: 0,
        onPageChange: vi.fn(),
      }}
      {...overrides}
    />,
  );
}

describe("AdminUsersDataTable", () => {
  it("renders empty message when there are no rows", () => {
    renderTable();
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("shows assigned sections instead of role on the teachers directory", () => {
    renderTable({
      lockRole: "teacher",
      listEmpty: false,
      rows: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          email: "tea@x.co",
          firstName: "Tia",
          lastName: "Teacher",
          role: "teacher",
          phone: "+2",
          avatarDisplayUrl: null,
          missingSection: false,
          ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
          sections: [{ id: "sec-1", name: "A1 Morning", cohortId: "coh-1", discountPercent: null }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalCount: 1,
        onPageChange: vi.fn(),
      },
    });

    expect(screen.getByText(dictEn.admin.users.colSections)).toBeInTheDocument();
    expect(screen.getByText("A1 Morning")).toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.users.colRole)).not.toBeInTheDocument();
    expect(screen.queryByText("teacher")).not.toBeInTheDocument();
  });

  it("shows sections with discount and parent on the students directory", () => {
    renderTable({
      lockRole: "student",
      listEmpty: false,
      rows: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          email: "stu@x.co",
          firstName: "Lina",
          lastName: "Alumno",
          role: "student",
          phone: "+3",
          avatarDisplayUrl: null,
          missingSection: false,
          ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
          sections: [
            { id: "sec-2", name: "B1 Evening", cohortId: "coh-1", discountPercent: 25 },
          ],
          monthlyDue: [{ amount: 90, currency: "USD" }],
          monthlyStatus: "yes",
          enrollmentFeeStatus: "no",
          lastEnrollmentAt: "2026-03-15T00:00:00.000Z",
          parents: [{ id: "44444444-4444-4444-4444-444444444444", firstName: "Ana", lastName: "Padre" }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalCount: 1,
        onPageChange: vi.fn(),
      },
    });

    expect(screen.queryByText(dictEn.admin.users.colDiscount)).not.toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colMonthlyDue)).toBeInTheDocument();
    expect(screen.getByText("$90")).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colEnrollmentFee)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colLastEnrollment)).toBeInTheDocument();
    expect(screen.getByTitle(dictEn.admin.users.monthlyStatusYesAria)).toBeInTheDocument();
    expect(screen.getByTitle(dictEn.admin.users.enrollmentFeeNoAria)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /B1 Evening/ })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/coh-1/sec-2",
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Padre Ana" })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/users/44444444-4444-4444-4444-444444444444",
    );
    expect(screen.queryByText(dictEn.admin.users.colEmail)).not.toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.users.colRole)).not.toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.users.colPhone)).not.toBeInTheDocument();
    expect(screen.queryByText("stu@x.co")).not.toBeInTheDocument();
    expect(screen.queryByText("+3")).not.toBeInTheDocument();
    expect(screen.queryByText("student")).not.toBeInTheDocument();
  });

  it("shows last access and children on the parents directory", () => {
    renderTable({
      lockRole: "parent",
      listEmpty: false,
      rows: [
        {
          id: "55555555-5555-5555-5555-555555555555",
          email: "ana@x.co",
          firstName: "Ana",
          lastName: "Padre",
          role: "parent",
          phone: "+5",
          avatarDisplayUrl: null,
          missingSection: false,
          ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
          emailDeliverable: true,
          lastSessionStartAt: null,
          monthlyStatus: "no",
          enrollmentFeeStatus: "yes",
          lastEnrollmentAt: "2026-04-01T00:00:00.000Z",
          children: [{ id: "66666666-6666-6666-6666-666666666666", firstName: "Lina", lastName: "Alumno" }],
          sections: [{ id: "sec-3", name: "A1 Morning", cohortId: "coh-1", discountPercent: null }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalCount: 1,
        onPageChange: vi.fn(),
      },
    });
    expect(screen.getByText(dictEn.admin.users.colLastAccess)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.lastAccessNever)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colMonthlyDue)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colEnrollmentFee)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colLastEnrollment)).toBeInTheDocument();
    expect(screen.getByTitle(dictEn.admin.users.monthlyStatusNoAria)).toBeInTheDocument();
    expect(screen.getByTitle(dictEn.admin.users.enrollmentFeeYesAria)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.users.colChildren)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alumno Lina" })).toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.users.colRole)).not.toBeInTheDocument();
  });
});
