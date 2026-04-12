import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationsScreenNarrow } from "@/components/pwa/organisms/AdminRegistrationsScreenNarrow";
import { AdminUsersScreenNarrow } from "@/components/pwa/organisms/AdminUsersScreenNarrow";
import { AdminImportScreenNarrow } from "@/components/pwa/organisms/AdminImportScreenNarrow";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/registrations/actions", () => ({
  deleteRegistration: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/deleteActions", () => ({
  deleteAdminUsers: vi.fn(() => Promise.resolve({ ok: true })),
}));

const regRow: AdminRegistrationRow = {
  id: "1",
  first_name: "A",
  last_name: "B",
  dni: "1",
  email: "a@x.co",
  phone: null,
  birth_date: null,
  level_interest: "A1",
  status: "new",
  created_at: "2026-01-01T00:00:00.000Z",
};

const userRow: AdminUserRow = {
  id: "u1",
  email: "u@x.co",
  firstName: "F",
  lastName: "L",
  role: "student",
  phone: "+1",
  avatarDisplayUrl: null,
};

describe("admin narrow screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AdminRegistrationsScreenNarrow renders list and sort controls", async () => {
    const user = userEvent.setup();
    render(
      <AdminRegistrationsScreenNarrow
        locale="es"
        rows={[regRow]}
        labels={dictEn.admin.registrations}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
        surface="web-mobile"
      />,
    );
    expect(screen.getByText("A B")).toBeInTheDocument();
    const nameSort = screen.getByRole("button", {
      name: new RegExp(`^${dictEn.admin.registrations.name}`),
    });
    await user.click(nameSort);
    await user.click(nameSort);
  });

  it("AdminUsersScreenNarrow renders and toggles sort", async () => {
    const user = userEvent.setup();
    render(
      <AdminUsersScreenNarrow
        rows={[userRow]}
        locale="es"
        currentUserId="other"
        labels={dictEn.admin.users}
        tableLabels={dictEn.admin.table}
        surface="pwa-mobile"
      />,
    );
    expect(screen.getByText("u@x.co")).toBeInTheDocument();
    const emailSort = screen.getByRole("button", {
      name: new RegExp(`^${dictEn.admin.users.colEmail}`),
    });
    await user.click(emailSort);
  });

  it("AdminImportScreenNarrow renders title", () => {
    render(<AdminImportScreenNarrow dict={dictEn} surface="web-mobile" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(dictEn.admin.import.title);
  });
});
