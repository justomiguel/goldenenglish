import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS } from "@/lib/dashboard/adminUsersTableHelpers";
import {
  AdminStudentParentsList,
  AdminStudentSectionsList,
} from "@/components/molecules/AdminStudentDirectoryCells";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";

const baseRow: AdminUserRow = {
  id: "s1",
  email: "s@x.co",
  firstName: "Lina",
  lastName: "Alumno",
  role: "student",
  phone: "+1",
  avatarDisplayUrl: null,
  missingSection: false,
  ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
};

describe("AdminStudentSectionsList", () => {
  it("links the section name and shows the discount on that section", () => {
    render(
      <AdminStudentSectionsList
        row={{
          ...baseRow,
          sections: [
            {
              id: "sec-1",
              name: "B1 Evening",
              cohortId: "coh-1",
              discountPercent: 25,
            },
            {
              id: "sec-2",
              name: "A1 Morning",
              cohortId: "coh-1",
              discountPercent: null,
            },
          ],
        }}
        locale="es"
        labels={dictEn.admin.users}
        emptyValue="—"
      />,
    );
    expect(screen.getByRole("link", { name: /B1 Evening/ })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/academic/coh-1/sec-1",
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A1 Morning" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/academic/coh-1/sec-2",
    );
  });
});

describe("AdminStudentParentsList", () => {
  it("links the parent name to their profile", () => {
    render(
      <AdminStudentParentsList
        row={{
          ...baseRow,
          parents: [{ id: "p1", firstName: "Ana", lastName: "Padre" }],
        }}
        locale="es"
        labels={dictEn.admin.users}
        emptyValue="—"
      />,
    );
    expect(screen.getByRole("link", { name: "Padre Ana" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/users/p1",
    );
  });
});
