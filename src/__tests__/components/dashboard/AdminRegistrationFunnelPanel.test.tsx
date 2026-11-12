import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import { dictEn } from "@/test/dictEn";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/registrations",
}));

const markPaid = vi.hoisted(() => vi.fn());
const sendContact = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/markRegistrationPaidInPersonAction", () => ({
  markRegistrationPaidInPersonAction: (...args: unknown[]) => markPaid(...args),
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/sendRegistrationContactEmailAction", () => ({
  sendRegistrationContactEmailAction: (...args: unknown[]) => sendContact(...args),
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/revertRegistrationFunnelStageAction", () => ({
  revertRegistrationFunnelStageAction: vi.fn(),
}));
vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: ({
    "aria-label": ariaLabel,
    onChange,
  }: {
    "aria-label"?: string;
    onChange: (value: string) => void;
  }) => <textarea aria-label={ariaLabel} onChange={(event) => onChange(event.target.value)} />,
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/assignRegistrationCohortSectionAction", () => ({
  assignRegistrationCohortSectionAction: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions", () => ({
  approveRegistrationReceiptAction: vi.fn(),
}));
const moveSection = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction", () => ({
  moveRegistrationSectionAction: (...args: unknown[]) => moveSection(...args),
}));
const revertEnrolled = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction", () => ({
  revertEnrolledRegistrationAction: (...args: unknown[]) => revertEnrolled(...args),
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

function renderPanel(r: AdminRegistrationRow, sections = [{ id: "sec-1", label: "A1" }]) {
  return render(
    <AdminRegistrationFunnelPanel
      locale="en"
      row={r}
      labels={labels}
      busy={false}
      sections={sections}
      selectedCohortId="323e4567-e89b-12d3-a456-426614174000"
      contact={{ isMinor: false, student: null, tutor: null }}
      onStartEnrollmentFee={vi.fn()}
      onMarkContacted={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

function stepBlock(): HTMLElement {
  const node = document.querySelector("[data-step-block]");
  if (!(node instanceof HTMLElement)) throw new Error("missing step block");
  return node;
}

describe("AdminRegistrationFunnelPanel", () => {
  it("puts mark contacted inside the block on Inscriptos", () => {
    renderPanel(row({ status: "new", enrollmentFeeMailSentAt: null }));
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepRegistered);
    expect(block).toContainElement(screen.getByRole("button", { name: labels.markContacted }));
    expect(screen.getByRole("button", { name: labels.markContacted }).className).toContain("color-background");
    expect(screen.queryByRole("button", { name: labels.funnel.back })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: labels.whatsappCta })).not.toBeInTheDocument();
  });

  it("puts the matrícula mail inside the block on Contactados", () => {
    renderPanel(row({ enrollmentFeeMailSentAt: null }));
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepContacted);
    expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.sendMail }));
    expect(block).not.toContainElement(screen.getByRole("button", { name: labels.matricula.markInPerson }));
    expect(screen.getByRole("button", { name: labels.matricula.markInPerson }).className).toContain("bg-transparent");
  });

  it("puts mark paid inside the block while waiting for payment", () => {
    renderPanel(row());
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepAwaitingPayment);
    expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.markInPerson }));
    expect(block).not.toContainElement(screen.getByRole("button", { name: labels.matricula.sendMail }));
    expect(screen.queryByRole("button", { name: labels.matricula.receiptPending })).not.toBeInTheDocument();
    expect(screen.queryByText(labels.joinBilling.legend)).not.toBeInTheDocument();
  });

  it("puts save section inside the block and the select outside it", () => {
    renderPanel(row({ feeCaptured: true, acceptedStudentId: "stu", intakeState: "needs_section" }));
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepPaid);
    expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.saveSection }));
    expect(block).not.toContainElement(screen.getByLabelText(labels.matricula.assignSection));
    expect(screen.getByRole("button", { name: labels.matricula.saveSection })).toBeDisabled();
    expect(screen.getByText(labels.joinBilling.legend)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.matricula.sendMail })).not.toBeInTheDocument();
    for (const name of [labels.editTitle, labels.delete, labels.funnel.close]) {
      expect(screen.getByRole("button", { name }).className).not.toContain(
        "bg-[color-mix(in_srgb,var(--color-success)_55%,black)]",
      );
    }
  });

  it("sends the contact mail to the tutor address", async () => {
    sendContact.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderPanel(
      row({
        status: "new",
        enrollmentFeeMailSentAt: null,
        tutor_email: "tutor@example.com",
      }),
    );
    await user.click(screen.getByRole("button", { name: labels.funnel.sendMail }));
    expect(screen.getByDisplayValue("tutor@example.com")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: labels.funnel.contactMailBody }), "Hola");
    await user.click(screen.getByRole("button", { name: labels.funnel.contactMailSend }));
    expect(sendContact).toHaveBeenCalledWith(
      expect.objectContaining({ registrationId: "r1", bodyHtml: expect.stringContaining("Hola") }),
    );
  });

  it("shows a missing email code and an unknown code", async () => {
    const user = userEvent.setup();
    sendContact.mockResolvedValueOnce({ ok: false, code: "missing_registration_email" });
    renderPanel(row({ status: "new", enrollmentFeeMailSentAt: null }));
    await user.click(screen.getByRole("button", { name: labels.funnel.sendMail }));
    await user.type(screen.getByRole("textbox", { name: labels.funnel.contactMailBody }), "Hola");
    await user.click(screen.getByRole("button", { name: labels.funnel.contactMailSend }));
    expect(await screen.findByText(labels.funnel.errors.missing_registration_email)).toBeInTheDocument();

    sendContact.mockResolvedValueOnce({ ok: false, code: "mystery_code" });
    await user.click(screen.getByRole("button", { name: labels.funnel.contactMailSend }));
    expect(await screen.findByText(/mystery_code/)).toBeInTheDocument();
  });

  it("shows the raw code when the payment failure is unknown", async () => {
    markPaid.mockResolvedValue({ ok: false, code: "mystery_code" });
    const user = userEvent.setup();
    renderPanel(row());
    await user.click(screen.getByRole("button", { name: labels.matricula.markInPerson }));
    expect(await screen.findByText(/mystery_code/)).toBeInTheDocument();
  });

  it("warns that a matrícula payment is cleared and the account stays", async () => {
    const user = userEvent.setup();
    renderPanel(
      row({
        status: "enrolled",
        feeCaptured: true,
        activeSectionNames: ["Morning"],
      }),
    );
    expect(stepBlock()).toHaveTextContent("Morning");
    await user.click(screen.getByRole("button", { name: labels.funnel.back }));
    const body = labels.funnel.enrolledBackFeeBody.replaceAll(
      "{{stage}}",
      labels.funnel.stageAwaitingPayment,
    );
    expect(screen.getByText(body)).toBeInTheDocument();
  });

  it("says there is no payment to clear when the cohort has no matrícula", async () => {
    const user = userEvent.setup();
    renderPanel(
      row({
        status: "enrolled",
        chargesEnrollmentFee: false,
        snapshotTotal: 0,
        feeCaptured: false,
        enrollmentFeeMailSentAt: null,
        activeSectionNames: ["Morning"],
      }),
    );
    await user.click(screen.getByRole("button", { name: labels.funnel.back }));
    const body = labels.funnel.enrolledBackNoFeeBody.replaceAll(
      "{{stage}}",
      labels.funnel.stageAwaitingSection,
    );
    expect(screen.getByText(body)).toBeInTheDocument();
  });

  it("shows section_move_same and an unknown move code", async () => {
    const user = userEvent.setup();
    moveSection.mockResolvedValueOnce({ ok: false, code: "section_move_same" });
    renderPanel(
      row({ status: "enrolled", activeSectionNames: ["Morning"] }),
      [
        { id: "sec-1", label: "Morning" },
        { id: "sec-2", label: "Afternoon" },
      ],
    );
    await user.selectOptions(screen.getByRole("combobox"), "sec-2");
    await user.click(screen.getByRole("button", { name: labels.matricula.saveSection }));
    expect(await screen.findByText(labels.funnel.errors.section_move_same)).toBeInTheDocument();

    moveSection.mockResolvedValueOnce({ ok: false, code: "mystery_move" });
    await user.click(screen.getByRole("button", { name: labels.matricula.saveSection }));
    expect(await screen.findByText(/mystery_move/)).toBeInTheDocument();
  });
});
