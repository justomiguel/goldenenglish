import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRegistrationTableRow } from "@/components/dashboard/AdminRegistrationTableRow";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.registrations;
const contact: RegistrationContactView = {
  isMinor: false,
  student: null,
  tutor: null,
};

function row(overrides: Partial<AdminRegistrationRow> = {}): AdminRegistrationRow {
  return {
    id: "r1",
    first_name: "Ana",
    last_name: "Perez",
    dni: "40111222",
    email: "ana@example.com",
    phone: null,
    birth_date: "2000-03-04",
    level_interest: null,
    status: "new",
    created_at: "2026-08-01T10:00:00.000Z",
    tutor_name: null,
    tutor_dni: null,
    tutor_email: null,
    tutor_phone: null,
    tutor_relationship: null,
    preferred_section_id: "sec-1",
    additionalSectionIds: [],
    existingStudentId: null,
    contacted_at: null,
    contacted_by: null,
    sourceSectionLinkId: null,
    requestedSectionFull: false,
    chargesEnrollmentFee: true,
    snapshotTotal: 80,
    ...overrides,
  };
}

function renderRow(r: AdminRegistrationRow, onStart = vi.fn()) {
  return render(
    <table>
      <tbody>
        <AdminRegistrationTableRow
          locale="en"
          r={r}
          busy={false}
          labels={labels}
          statusLabel={(s) => s}
          contact={contact}
          instituteName="GE"
          expanded={false}
          onToggleExpanded={vi.fn()}
          onAccept={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onMarkContacted={vi.fn()}
          onRevertToNew={vi.fn()}
          onStartEnrollmentFee={onStart}
        />
      </tbody>
    </table>,
  );
}

describe("AdminRegistrationTableRow", () => {
  it("shows the start-fee-flow button only when the requested section still has a seat", () => {
    renderRow(row());
    expect(screen.getByRole("button", { name: labels.startEnrollmentFeeFlow })).toBeInTheDocument();
  });

  it("shows the trial-class badge on trial leads", () => {
    renderRow(row({ intent: "trial", chargesEnrollmentFee: false, snapshotTotal: 0 }));
    expect(screen.getByText(labels.trialClassBadge)).toBeInTheDocument();
  });

  it("hides the start-fee-flow button when the lead has no matrícula to collect", () => {
    renderRow(row({ chargesEnrollmentFee: false, snapshotTotal: 0 }));
    expect(
      screen.queryByRole("button", { name: labels.startEnrollmentFeeFlow }),
    ).not.toBeInTheDocument();
  });

  it("marks a full-section lead in red and hides the start-fee-flow button", () => {
    const { container } = renderRow(row({ requestedSectionFull: true }));
    expect(container.querySelector("tr")).toHaveClass("bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]");
    expect(
      screen.queryByRole("button", { name: labels.startEnrollmentFeeFlow }),
    ).not.toBeInTheDocument();
  });
});
