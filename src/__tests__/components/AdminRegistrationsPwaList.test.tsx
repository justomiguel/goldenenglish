import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRegistrationsPwaList } from "@/components/pwa/molecules/AdminRegistrationsPwaList";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { dictEn } from "@/test/dictEn";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const labels = dictEn.admin.registrations;

const row: AdminRegistrationRow = {
  id: "reg-1",
  first_name: "Ana",
  last_name: "Pérez",
  dni: "123",
  email: "ana@x.co",
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
  preferred_section_id: null,
  additionalSectionIds: [],
  existingStudentId: null,
  contacted_at: null,
  contacted_by: null,
  sourceSectionLinkId: null,
};

const handlers = {
  onAccept: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onMarkContacted: () => {},
  onRevertToNew: () => {},
  onStartEnrollmentFee: () => {},
  onStartJoinCharge: () => {},
};

function installDialog() {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
}

describe("AdminRegistrationsPwaList", () => {
  beforeEach(() => {
    installDialog();
  });

  it("shows the empty message without the sort sheet", () => {
    render(
      <AdminRegistrationsPwaList
        toolbar={<span>filters</span>}
        labels={labels}
        tableLabels={dictEn.admin.table}
        listEmpty
        rows={[]}
        locale="es"
        sortKey="received"
        sortDir="desc"
        onToggleSort={() => {}}
        statusLabel={(status) => status}
        contactFor={() => ({ isMinor: false, student: null, tutor: null })}
        instituteName="Test Institute"
        busyId={null}
        {...handlers}
        emptyMessage="none"
        pagination={{ page: 1, pageSize: 10, totalCount: 0, onPageChange: () => {} }}
      />,
    );

    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sort:/ })).not.toBeInTheDocument();
  });

  it("keeps the table tour anchor and sorts from the sheet", async () => {
    const user = userEvent.setup();
    const onToggleSort = vi.fn();
    const { container } = render(
      <AdminRegistrationsPwaList
        toolbar={<span>filters</span>}
        labels={labels}
        tableLabels={dictEn.admin.table}
        listEmpty={false}
        rows={[row]}
        locale="es"
        sortKey="received"
        sortDir="desc"
        onToggleSort={onToggleSort}
        statusLabel={(status) => status}
        contactFor={() => ({ isMinor: false, student: null, tutor: null })}
        instituteName="Test Institute"
        busyId={null}
        {...handlers}
        emptyMessage="none"
        pagination={{ page: 1, pageSize: 10, totalCount: 1, onPageChange: () => {} }}
      />,
    );

    expect(container.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.registrationsTable}"]`)).not.toBeNull();
    expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: labels.name })).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /Sort:/ }));
    await user.click(screen.getByRole("button", { name: labels.name }));
    expect(onToggleSort).toHaveBeenCalledWith("name");
  });
});
