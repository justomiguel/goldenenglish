import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminUsersTable } from "@/components/dashboard/AdminUsersTable";

vi.mock("@/components/molecules/SurfaceMountGate", () => ({
  SurfaceMountGate: ({ desktop }: { desktop: React.ReactNode }) => desktop,
}));

const refresh = vi.fn();
const deleteAdminUsers = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/deleteActions", () => ({
  deleteAdminUsers: (...a: unknown[]) => deleteAdminUsers(...a),
}));

const rows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "self@x.co",
    firstName: "Me",
    lastName: "Admin",
    role: "admin",
    phone: "+1",
    avatarDisplayUrl: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "u@x.co",
    firstName: "U",
    lastName: "Ser",
    role: "student",
    phone: "+2",
    avatarDisplayUrl: null,
  },
];

describe("AdminUsersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteAdminUsers.mockResolvedValue({ ok: true, deleted: 1 });
  });

  it("renders counters and row emails", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    expect(screen.getByText("u@x.co")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(dictEn.admin.users.filterPlaceholder),
    ).toBeInTheDocument();
  });

  it("toggles column sort and opens delete confirmation", async () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    const emailBtn = screen.getByRole("button", { name: new RegExp(dictEn.admin.users.colEmail) });
    fireEvent.click(emailBtn);
    fireEvent.click(emailBtn);

    const rowDelete = screen.getByRole("button", {
      name: `${dictEn.admin.users.deleteOne}: u@x.co`,
    });
    fireEvent.click(rowDelete);

    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText(dictEn.admin.users.confirmDeleteCascade)).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole("button", { name: dictEn.admin.users.confirmDelete }));
    await waitFor(() => expect(deleteAdminUsers).toHaveBeenCalled());
    expect(deleteAdminUsers).toHaveBeenCalledWith(
      "en",
      expect.arrayContaining(["22222222-2222-2222-2222-222222222222"]),
    );
  });

  it("submits filter form without error", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    const form = screen.getByLabelText(dictEn.admin.users.filterLabel).closest("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
  });

  it("sorts by role and phone columns", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(dictEn.admin.users.colRole) }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(dictEn.admin.users.colPhone) }));
  });

  it("alerts on partial delete", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    deleteAdminUsers.mockResolvedValueOnce({ ok: true, deleted: 1, partial: true });
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.selectAllFiltered }));
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.deleteSelectedWithCount.replace(/\{\{count\}\}/g, "1"),
      }),
    );
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: dictEn.admin.users.confirmDelete }));
    await waitFor(() => expect(deleteAdminUsers).toHaveBeenCalled());
    expect(alertSpy).toHaveBeenCalledWith(dictEn.admin.users.deletePartial);
    alertSpy.mockRestore();
  });

  it("alerts on delete failure", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    deleteAdminUsers.mockResolvedValueOnce({
      ok: false,
      message: dictEn.admin.users.errDeleteAllFailed,
    });
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.selectAllFiltered }));
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.deleteSelectedWithCount.replace(/\{\{count\}\}/g, "1"),
      }),
    );
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: dictEn.admin.users.confirmDelete }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        `${dictEn.admin.users.deleteError}: ${dictEn.admin.users.errDeleteAllFailed}`,
      ),
    );
    alertSpy.mockRestore();
  });

  it("does not alert when delete result is none", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    deleteAdminUsers.mockResolvedValueOnce({ ok: false });
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.selectAllFiltered }));
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.deleteSelectedWithCount.replace(/\{\{count\}\}/g, "1"),
      }),
    );
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: dictEn.admin.users.confirmDelete }));
    await waitFor(() => expect(deleteAdminUsers).toHaveBeenCalled());
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("toggles per-row checkbox (toggleRow)", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    const rowCb = screen.getByRole("checkbox", {
      name: `${dictEn.admin.users.selectRow} u@x.co`,
    });
    fireEvent.click(rowCb);
    expect(rowCb).toBeChecked();
    fireEvent.click(rowCb);
    expect(rowCb).not.toBeChecked();
  });

  it("clears selection when select-all is toggled off", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    const selectAll = screen.getByRole("checkbox", { name: dictEn.admin.users.selectAllVisible });
    fireEvent.click(selectAll);
    fireEvent.click(selectAll);
    const rowCb = screen.getByRole("checkbox", {
      name: `${dictEn.admin.users.selectRow} u@x.co`,
    });
    expect(rowCb).not.toBeChecked();
  });

  it("closes delete confirmation via cancel", async () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.selectAllFiltered }));
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.deleteSelectedWithCount.replace(/\{\{count\}\}/g, "1"),
      }),
    );
    const dlg = await screen.findByRole("dialog");
    fireEvent.click(within(dlg).getByRole("button", { name: dictEn.admin.users.cancel }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("toggles name, role, and phone columns to descending sort", () => {
    render(
      <AdminUsersTable
        tableLabels={dictEn.admin.table}
        rows={rows}
        locale="en"
        currentUserId="11111111-1111-1111-1111-111111111111"
        labels={dictEn.admin.users}
      />,
    );
    for (const col of [dictEn.admin.users.colName, dictEn.admin.users.colRole, dictEn.admin.users.colPhone]) {
      const btn = screen.getByRole("button", { name: new RegExp(col) });
      fireEvent.click(btn);
      fireEvent.click(btn);
    }
  });
});
