import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersPwaListItem } from "@/components/pwa/molecules/AdminUsersPwaListItem";
import {
  EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  type AdminUserRow,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.users;

const row: AdminUserRow = {
  id: "u1",
  email: "ana@x.co",
  firstName: "Ana",
  lastName: "Pérez",
  role: "student",
  phone: "+56911112222",
  avatarDisplayUrl: null,
  missingSection: false,
  ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  enrollmentFeeStatus: "no",
  monthlyStatus: "yes",
};

describe("AdminUsersPwaListItem", () => {
  it("shows the surname-first name and the unpaid enrollment fee", () => {
    render(
      <AdminUsersPwaListItem
        locale="es"
        labels={labels}
        row={row}
        currentUserId="other"
        selected={false}
        busy={false}
        studentsDirectory
        teachersDirectory={false}
        emptyValue="—"
        onToggleRow={() => {}}
        onRequestDeleteOne={() => {}}
      />,
    );

    expect(screen.getByRole("link", { name: "Pérez Ana" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/users/u1",
    );
    expect(screen.getByText(labels.colEnrollmentFee)).toBeInTheDocument();
    expect(screen.getByTitle(labels.monthlyStatusYesAria)).toBeInTheDocument();
  });

  it("selects the row and asks to delete it", async () => {
    const user = userEvent.setup();
    const onToggleRow = vi.fn();
    const onRequestDeleteOne = vi.fn();
    render(
      <AdminUsersPwaListItem
        locale="es"
        labels={labels}
        row={row}
        currentUserId="other"
        selected={false}
        busy={false}
        studentsDirectory={false}
        teachersDirectory={false}
        emptyValue="—"
        onToggleRow={onToggleRow}
        onRequestDeleteOne={onRequestDeleteOne}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: `${labels.deleteOne}: ${row.email}` }));
    expect(onToggleRow).toHaveBeenCalledWith("u1");
    expect(onRequestDeleteOne).toHaveBeenCalledWith("u1");
  });

  it("blocks select and delete on the signed-in account", () => {
    render(
      <AdminUsersPwaListItem
        locale="es"
        labels={labels}
        row={row}
        currentUserId="u1"
        selected={false}
        busy={false}
        studentsDirectory={false}
        teachersDirectory={false}
        emptyValue="—"
        onToggleRow={() => {}}
        onRequestDeleteOne={() => {}}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: `${labels.deleteOne}: ${row.email}` })).toBeDisabled();
  });

  // REGRESSION CHECK: Directory mobile cards must not render duplicate view/edit icon links that crush person names on narrow screens.
  it("omits the duplicate edit icon link while keeping the profile view link and delete button", () => {
    render(
      <AdminUsersPwaListItem
        locale="es"
        labels={labels}
        row={row}
        currentUserId="other"
        selected={false}
        busy={false}
        studentsDirectory={false}
        teachersDirectory={false}
        emptyValue="—"
        onToggleRow={() => {}}
        onRequestDeleteOne={() => {}}
      />,
    );

    expect(screen.getByRole("link", { name: `${labels.viewOne}: ${row.email}` })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: `${labels.editOne}: ${row.email}` })).not.toBeInTheDocument();
  });
});
