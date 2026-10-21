import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRegistrationPwaCard } from "@/components/pwa/molecules/AdminRegistrationPwaCard";
import { dictEn } from "@/test/dictEn";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const labels = dictEn.admin.registrations;

const row: AdminRegistrationRow = {
  id: "reg-1",
  first_name: "Ana",
  last_name: "Pérez",
  dni: "123",
  email: "ana@x.co",
  phone: "+56911112222",
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

describe("AdminRegistrationPwaCard", () => {
  beforeEach(() => {
    installDialog();
  });

  it("offers WhatsApp and accept on the card", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <AdminRegistrationPwaCard
        locale="es"
        r={row}
        busy={false}
        labels={labels}
        statusLabel={(status) => status}
        contact={{
          isMinor: false,
          student: { label: "Ana", phoneDisplay: "+56911112222", whatsAppDigits: "56911112222" },
          tutor: null,
        }}
        instituteName="Test Institute"
        onAccept={onAccept}
        onEdit={() => {}}
        onDelete={() => {}}
        onMarkContacted={() => {}}
        onRevertToNew={() => {}}
        onStartEnrollmentFee={() => {}}
        onStartJoinCharge={() => {}}
      />,
    );

    expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.whatsappCta })).toHaveAttribute(
      "href",
      "https://wa.me/56911112222",
    );
    await user.click(screen.getByRole("button", { name: labels.accept }));
    expect(onAccept).toHaveBeenCalledWith(row);
  });

  it("moves edit into the more-actions sheet", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <AdminRegistrationPwaCard
        locale="es"
        r={row}
        busy={false}
        labels={labels}
        statusLabel={(status) => status}
        contact={{ isMinor: false, student: null, tutor: null }}
        instituteName="Test Institute"
        onAccept={() => {}}
        onEdit={onEdit}
        onDelete={() => {}}
        onMarkContacted={() => {}}
        onRevertToNew={() => {}}
        onStartEnrollmentFee={() => {}}
        onStartJoinCharge={() => {}}
      />,
    );

    expect(screen.queryByRole("link", { name: labels.whatsappCta })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.moreActionsAria.replace("{{name}}", "Pérez Ana") }));
    await user.click(screen.getByRole("button", { name: labels.editTitle }));
    expect(onEdit).toHaveBeenCalledWith(row);
  });
});
