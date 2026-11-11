import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import { dictEn } from "@/test/dictEn";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const markPaid = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/markRegistrationPaidInPersonAction", () => ({
  markRegistrationPaidInPersonAction: (...args: unknown[]) => markPaid(...args),
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/assignRegistrationCohortSectionAction", () => ({
  assignRegistrationCohortSectionAction: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions", () => ({
  approveRegistrationReceiptAction: vi.fn(),
}));

const labels = dictEn.admin.registrations;

function row(overrides: Partial<AdminRegistrationRow> = {}): AdminRegistrationRow {
  return {
    id: "r1",
    first_name: "Ana",
    last_name: "Perez",
    dni: "1",
    email: "ana@example.com",
    phone: null,
    birth_date: null,
    level_interest: null,
    status: "contacted",
    created_at: null,
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
    chargesEnrollmentFee: true,
    snapshotTotal: 80,
    enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
    ...overrides,
  };
}

function renderPanel(r: AdminRegistrationRow) {
  return render(
    <AdminRegistrationFunnelPanel
      locale="en"
      row={r}
      labels={labels}
      busy={false}
      sections={[{ id: "sec-1", label: "A1" }]}
      contact={{ isMinor: false, student: null, tutor: null }}
      onStartEnrollmentFee={vi.fn()}
      onMarkContacted={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe("AdminRegistrationFunnelPanel", () => {
  it("hides join billing until the section stage", () => {
    renderPanel(row());
    expect(screen.queryByText(labels.joinBilling.legend)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.matricula.sendMail })).toBeInTheDocument();
    expect(labels.joinBilling.current).not.toMatch(/matrícula|enrollment fee/i);
  });

  it("shows join billing on the section stage", () => {
    renderPanel(
      row({
        feeCaptured: true,
        acceptedStudentId: "stu",
        intakeState: "needs_section",
      }),
    );
    expect(screen.getByText(labels.joinBilling.legend)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.matricula.sendMail })).not.toBeInTheDocument();
  });

  it("shows the raw code when the payment failure is unknown", async () => {
    markPaid.mockResolvedValue({ ok: false, code: "mystery_code" });
    const user = userEvent.setup();
    renderPanel(row());
    await user.click(screen.getByRole("button", { name: labels.matricula.markInPerson }));
    expect(await screen.findByText(/mystery_code/)).toBeInTheDocument();
  });
});
