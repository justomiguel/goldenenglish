/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserDetailTutorLinkedRow } from "@/components/molecules/AdminUserDetailTutorLinkedRow";
import { dictEn } from "@/test/dictEn";

describe("AdminUserDetailTutorLinkedRow", () => {
  it("renders unlink control when editable and notifies request", async () => {
    const user = userEvent.setup();
    const onRequestUnlink = vi.fn();
    render(
      <AdminUserDetailTutorLinkedRow
        locale="en"
        tutor={{
          tutorId: "t1",
          displayName: "Pérez Ana",
          emailDisplay: "a@example.com",
          relationshipCode: "mother",
        }}
        relationshipLabel={dictEn.admin.users.detailTutorRelationshipMother}
        openProfileLabel={dictEn.admin.users.detailTutorOpenProfile}
        editable
        rowBusy={false}
        unlinkLabel="Quitar vínculo"
        unlinkAriaLabel="Quitar vínculo: Pérez Ana"
        onRequestUnlink={onRequestUnlink}
      />,
    );
    expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `${dictEn.admin.users.detailTutorOpenProfile}: Pérez Ana` })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/users/t1",
    );
    await user.click(screen.getByRole("button", { name: "Quitar vínculo: Pérez Ana" }));
    expect(onRequestUnlink).toHaveBeenCalledTimes(1);
  });

  it("hides unlink when not editable", () => {
    render(
      <AdminUserDetailTutorLinkedRow
        locale="es"
        tutor={{ tutorId: "t1", displayName: "X", emailDisplay: "y@z.com", relationshipCode: null }}
        relationshipLabel={dictEn.admin.users.detailTutorRelationshipNotSpecified}
        openProfileLabel={dictEn.admin.users.detailTutorOpenProfile}
        editable={false}
        rowBusy={false}
        unlinkLabel="Remove"
        unlinkAriaLabel="Remove X"
        onRequestUnlink={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: `${dictEn.admin.users.detailTutorOpenProfile}: X` })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/users/t1",
    );
    expect(screen.queryByRole("button", { name: "Remove X" })).not.toBeInTheDocument();
  });
});
