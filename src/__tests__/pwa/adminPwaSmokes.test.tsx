import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationPwaCard } from "@/components/pwa/molecules/AdminRegistrationPwaCard";
import { AdminRegistrationsPwaList } from "@/components/pwa/molecules/AdminRegistrationsPwaList";
import { AdminUsersPwaList } from "@/components/pwa/molecules/AdminUsersPwaList";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";

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
  tutor_name: null,
  tutor_dni: null,
  tutor_email: null,
  tutor_phone: null,
  tutor_relationship: null,
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

describe("admin PWA smoke", () => {
  it("AdminRegistrationPwaCard renders", () => {
    render(
      <AdminRegistrationPwaCard
        locale="es"
        r={regRow}
        busy={false}
        labels={dictEn.admin.registrations}
        statusLabel={(s) => s}
        onAccept={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("A B")).toBeInTheDocument();
  });

  it("AdminRegistrationsPwaList empty", () => {
    render(
      <AdminRegistrationsPwaList
        toolbar={<span>t</span>}
        labels={dictEn.admin.registrations}
        tableLabels={dictEn.admin.table}
        listEmpty
        rows={[]}
        locale="es"
        sortKey="name"
        sortDir="asc"
        onToggleSort={() => {}}
        statusLabel={(s) => s}
        busyId={null}
        onAccept={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        emptyMessage="none"
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 0,
          onPageChange: () => {},
        }}
      />,
    );
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("AdminRegistrationsPwaList with row", () => {
    render(
      <AdminRegistrationsPwaList
        toolbar={<span>t</span>}
        labels={dictEn.admin.registrations}
        tableLabels={dictEn.admin.table}
        listEmpty={false}
        rows={[regRow]}
        locale="es"
        sortKey="name"
        sortDir="asc"
        onToggleSort={() => {}}
        statusLabel={(s) => s}
        busyId={null}
        onAccept={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        emptyMessage="none"
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 1,
          onPageChange: () => {},
        }}
      />,
    );
    expect(screen.getByText("A B")).toBeInTheDocument();
  });

  it("AdminUsersPwaList empty", () => {
    render(
      <AdminUsersPwaList
        locale="es"
        toolbar={<span>t</span>}
        labels={dictEn.admin.users}
        tableLabels={dictEn.admin.table}
        listEmpty
        rows={[]}
        currentUserId="x"
        sortKey="email"
        sortDir="asc"
        onToggleSort={() => {}}
        selectedIds={new Set()}
        onToggleRow={() => {}}
        allVisibleSelected={false}
        onToggleSelectAllVisible={() => {}}
        deletableVisibleCount={0}
        busy={false}
        onRequestDeleteOne={() => {}}
        emptyMessage="empty"
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 0,
          onPageChange: () => {},
        }}
      />,
    );
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("AdminUsersPwaList with row", () => {
    render(
      <AdminUsersPwaList
        locale="es"
        toolbar={<span>t</span>}
        labels={dictEn.admin.users}
        tableLabels={dictEn.admin.table}
        listEmpty={false}
        rows={[userRow]}
        currentUserId="other"
        sortKey="email"
        sortDir="asc"
        onToggleSort={() => {}}
        selectedIds={new Set()}
        onToggleRow={() => {}}
        allVisibleSelected={false}
        onToggleSelectAllVisible={() => {}}
        deletableVisibleCount={1}
        busy={false}
        onRequestDeleteOne={() => {}}
        emptyMessage="empty"
        pagination={{
          page: 1,
          pageSize: 10,
          totalCount: 1,
          onPageChange: () => {},
        }}
      />,
    );
    expect(screen.getByText("u@x.co")).toBeInTheDocument();
  });
});
