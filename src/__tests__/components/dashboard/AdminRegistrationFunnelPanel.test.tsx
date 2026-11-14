import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import type { RegistrationWorkTask } from "@/hooks/useMarkContactedWithLoader";
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
  registrationEnrollmentReceiptUrlAction: vi.fn(async () => ({ ok: true, url: "https://signed.example/receipt" })),
}));
const moveSection = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction", () => ({
  moveRegistrationSectionAction: (...args: unknown[]) => moveSection(...args),
}));
const revertEnrolled = vi.hoisted(() => vi.fn());
vi.mock("@/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction", () => ({
  revertEnrolledRegistrationAction: (...args: unknown[]) => revertEnrolled(...args),
}));

// REGRESSION CHECK: The actions popup keeps one header close, a contact hint only on pre-enrolled, and Edit plus Delete on one colored row.
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

const quietWork = (task: RegistrationWorkTask) => {
  void task();
};

function PanelHarness({
  r,
  sections,
}: {
  r: AdminRegistrationRow;
  sections: { id: string; label: string }[];
}) {
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <>
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
        onWork={(task) => {
          setWorking(true);
          setNotice(null);
          void task().then((message) => {
            setWorking(false);
            setNotice(typeof message === "string" && message.trim() ? message : null);
          });
        }}
      />
      {working ? <p role="status">{labels.funnel.markingBody}</p> : null}
      {notice ? <p>{notice}</p> : null}
    </>
  );
}

function renderPanel(r: AdminRegistrationRow, sections = [{ id: "sec-1", label: "A1" }]) {
  return render(<PanelHarness r={r} sections={sections} />);
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
    const mark = screen.getByRole("button", { name: labels.markContacted });
    expect(mark.className).toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(block.className).not.toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(screen.queryByRole("button", { name: labels.funnel.back })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: labels.whatsappCta })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Perez Ana" })).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText(labels.funnel.afterTalk)).toBeInTheDocument();
    expect(screen.getByText(labels.funnel.contactChoose)).toBeInTheDocument();
    const person = document.querySelector("[data-registration-person]");
    const figure = document.querySelector("[data-contact-figure]");
    expect(figure).toBeInstanceOf(HTMLImageElement);
    expect(figure).toHaveAttribute("src", "/images/dashboard/registration-contact.jpg");
    expect(person?.compareDocumentPosition(figure!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(figure?.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector("[data-contact-actions]")?.className).toContain("flex-col");
    expect(screen.getByText(labels.funnel.mailTip)).toBeInTheDocument();
    expect(screen.queryByText(labels.funnel.contactOr)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.funnel.close })).not.toBeInTheDocument();
    const edit = screen.getByRole("button", { name: labels.editTitle });
    const remove = screen.getByRole("button", { name: labels.delete });
    expect(edit.parentElement).toBe(remove.parentElement);
    expect(edit.parentElement?.className).toContain("flex-row");
    expect(edit.className).toContain("bg-[var(--color-primary)]");
    expect(remove.className).toContain("border-[var(--color-error)]");
  });

  it("offers mail or WhatsApp when the file has a phone", () => {
    render(
      <AdminRegistrationFunnelPanel
        locale="en"
        row={row({ status: "new", enrollmentFeeMailSentAt: null })}
        labels={labels}
        busy={false}
        sections={[]}
        contact={{
          isMinor: false,
          student: { label: null, phoneDisplay: "+56 9 1111 1111", whatsAppDigits: "56911111111" },
          tutor: null,
        }}
        onStartEnrollmentFee={vi.fn()}
        onMarkContacted={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        onWork={quietWork}
      />,
    );
    expect(screen.getAllByText(labels.funnel.contactOr)).toHaveLength(2);
    expect(screen.getByText(labels.funnel.whatsappTip)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.whatsappCta })).toHaveAttribute(
      "href",
      "https://wa.me/56911111111",
    );
    expect(screen.getByRole("link", { name: labels.funnel.callCta })).toHaveAttribute(
      "href",
      "tel:+56911111111",
    );
  });

  it("offers a phone call when the number cannot open WhatsApp", () => {
    render(
      <AdminRegistrationFunnelPanel
        locale="en"
        row={row({ status: "new", enrollmentFeeMailSentAt: null })}
        labels={labels}
        busy={false}
        sections={[]}
        contact={{
          isMinor: false,
          student: { label: null, phoneDisplay: "9 1111 1111", whatsAppDigits: null },
          tutor: null,
        }}
        onStartEnrollmentFee={vi.fn()}
        onMarkContacted={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        onWork={quietWork}
      />,
    );
    expect(screen.queryByRole("link", { name: labels.whatsappCta })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.funnel.callCta })).toHaveAttribute(
      "href",
      "tel:911111111",
    );
  });

  it("closes the popup when mark contacted starts", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onMarkContacted = vi.fn();
    render(
      <AdminRegistrationFunnelPanel
        locale="en"
        row={row({ status: "new", enrollmentFeeMailSentAt: null })}
        labels={labels}
        busy={false}
        sections={[]}
        contact={{ isMinor: false, student: null, tutor: null }}
        onStartEnrollmentFee={vi.fn()}
        onMarkContacted={onMarkContacted}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClose={onClose}
        onWork={quietWork}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.markContacted }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onMarkContacted).toHaveBeenCalledOnce();
  });

  it("stacks the matrícula mail and the in-person payment beside the fee photo", () => {
    renderPanel(row({ enrollmentFeeMailSentAt: null }));
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepContacted);
    expect(block).toHaveTextContent(labels.funnel.feeAfter);
    expect(block.className).not.toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(document.querySelector("[data-stage-figure]")).toHaveAttribute(
      "src",
      "/images/dashboard/registration-fee.jpg",
    );
    expect(screen.getByRole("heading", { name: labels.funnel.feeChoose })).toBeInTheDocument();
    expect(screen.getByText(labels.funnel.contactOr)).toBeInTheDocument();
    const send = screen.getByRole("button", { name: labels.matricula.sendMail });
    const paid = screen.getByRole("button", { name: labels.matricula.markInPerson });
    expect(send.className).toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(paid.className).not.toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(document.querySelector("[data-stage-actions]")?.className).toContain("flex-col");
    expect(block).not.toContainElement(send);
    expect(screen.getByRole("heading", { name: "Perez Ana" })).toBeInTheDocument();
    expect(screen.queryByText(labels.funnel.afterTalk)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.funnel.contactChoose)).not.toBeInTheDocument();
  });

  it("stacks mark paid beside the payment photo", () => {
    renderPanel(row());
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepAwaitingPayment);
    expect(block).toHaveTextContent(labels.funnel.payAfter);
    expect(document.querySelector("[data-stage-figure]")).toHaveAttribute(
      "src",
      "/images/dashboard/registration-payment.jpg",
    );
    const paid = screen.getByRole("button", { name: labels.matricula.markInPerson });
    expect(paid.className).toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(block).not.toContainElement(paid);
    expect(screen.getByRole("button", { name: labels.matricula.sendMail })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.matricula.receiptPending })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.intake.viewReceipt })).not.toBeInTheDocument();
    expect(screen.queryByText(labels.joinBilling.legend)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.matricula.approvedWithoutSection)).not.toBeInTheDocument();
  });

  it("shows the uploaded receipt for manual approval", () => {
    renderPanel(row({ enrollmentFeeReceiptPath: "receipts/ana.png" }));
    expect(screen.getByRole("button", { name: labels.intake.viewReceipt })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.matricula.receiptPending })).toBeInTheDocument();
  });

  it("hides the approved-student line while payment is still pending", () => {
    renderPanel(row({
      acceptedStudentId: "stu-1",
      intakeState: "needs_section",
    }));
    expect(screen.queryByText(labels.matricula.approvedWithoutSection)).not.toBeInTheDocument();
  });

  it("puts save section inside the block and the select outside it", () => {
    renderPanel(row({ feeCaptured: true, acceptedStudentId: "stu", intakeState: "needs_section" }));
    const block = stepBlock();
    expect(block).toHaveTextContent(labels.funnel.stepPaid);
    expect(document.querySelector("[data-stage-figure]")).toHaveAttribute(
      "src",
      "/images/dashboard/registration-seat.jpg",
    );
    const save = screen.getByRole("button", { name: labels.matricula.saveSection });
    expect(block).toContainElement(save);
    expect(save.className).toContain("bg-[color-mix(in_srgb,var(--color-success)_55%,black)]");
    expect(block).not.toContainElement(screen.getByLabelText(labels.matricula.assignSection));
    expect(screen.getByRole("button", { name: labels.matricula.saveSection })).toBeDisabled();
    expect(screen.getByText(labels.joinBilling.legend)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.matricula.sendMail })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.funnel.close })).not.toBeInTheDocument();
    for (const name of [labels.editTitle, labels.delete]) {
      expect(screen.getByRole("button", { name }).className).not.toContain(
        "bg-[color-mix(in_srgb,var(--color-success)_55%,black)]",
      );
    }
  });

  it("shows the two-chair photo while the lead waits for a section", () => {
    renderPanel(row({
      status: "contacted",
      chargesEnrollmentFee: false,
      snapshotTotal: 0,
      enrollmentFeeMailSentAt: null,
      feeCaptured: false,
    }));
    expect(stepBlock()).toHaveTextContent(labels.funnel.stepAwaitingSection);
    expect(document.querySelector("[data-stage-figure]")).toHaveAttribute(
      "src",
      "/images/dashboard/registration-section.jpg",
    );
    expect(screen.getByRole("heading", { name: labels.funnel.waitChoose })).toBeInTheDocument();
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

  it("shows the loader while a popup action runs", async () => {
    let finish: (value: { ok: true }) => void = () => undefined;
    markPaid.mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve;
    }));
    const user = userEvent.setup();
    renderPanel(row());
    await user.click(screen.getByRole("button", { name: labels.matricula.markInPerson }));
    expect(await screen.findByRole("status")).toHaveTextContent(labels.funnel.markingBody);
    finish({ ok: true });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
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
    expect(screen.getByText(/Morning/)).toBeInTheDocument();
    expect(document.querySelector("[data-stage-figure]")).toHaveAttribute(
      "src",
      "/images/dashboard/registration-enrolled.jpg",
    );
    expect(screen.queryByRole("button", { name: labels.funnel.close })).not.toBeInTheDocument();
    expect(screen.queryByText(labels.funnel.contactChoose)).not.toBeInTheDocument();
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
