// REGRESSION CHECK: RegisterForm asks for DNI first, keeps all student and tutor/contact fields editable after Continue, and pre-fills existing student data when lookup matches.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPush } from "@/test/navigationMock";
import { registerDniDraftKey, writeRegisterDniDraft } from "@/lib/register/registerDniDraft";

const submitPublicRegistration = vi.hoisted(() => vi.fn());
const lookupRegistrationStudentAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration,
}));

vi.mock("@/app/[locale]/register/lookupRegistrationStudentAction", () => ({
  lookupRegistrationStudentAction,
}));

import { RegisterForm } from "@/components/register/RegisterForm";

const SECTION_ID = "00000000-0000-4000-8000-000000000001";
const SECTION_OPTIONS = [{ id: SECTION_ID, label: "2026 — B1 Morning" }];

describe("RegisterForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
    submitPublicRegistration.mockReset();
    lookupRegistrationStudentAction.mockReset();
    lookupRegistrationStudentAction.mockResolvedValue({ ok: true, found: false });
  });

  /** react-day-picker: month option values are 0–11 (en/locale-independent). */
  function pickRegisterBirthIso(isoYmd: string) {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd.trim());
    if (!matched) throw new Error(`invalid iso: ${isoYmd}`);
    const y = matched[1];
    const mo1 = Number(matched[2]);
    const dd = matched[3];
    const scope = document.querySelector(".register-day-picker-scope");
    if (!(scope instanceof HTMLElement)) throw new Error("birth picker scope missing");

    const monthSelect = scope.querySelector("select[data-register-birth-month]");
    const yearSelect = scope.querySelector("select[data-register-birth-year]");
    if (!(monthSelect instanceof HTMLSelectElement))
      throw new Error("months dropdown missing");
    if (!(yearSelect instanceof HTMLSelectElement))
      throw new Error("years dropdown missing");

    fireEvent.change(monthSelect, { target: { value: String(mo1 - 1) } });
    fireEvent.change(yearSelect, { target: { value: y } });

    const ymdAttr = `${y}-${matched[2]}-${dd}`;
    const cell = scope.querySelector(`td[data-day="${ymdAttr}"]`);
    const btn = cell?.querySelector("button");
    if (!(btn instanceof HTMLButtonElement)) {
      throw new Error(`day button missing for ${ymdAttr}`);
    }
    fireEvent.click(btn);
  }

  async function continueFromDniStep(dniValue = "12345678") {
    const r = dictEn.register;
    fireEvent.change(screen.getByLabelText(r.dni), { target: { value: dniValue } });
    fireEvent.click(screen.getByRole("button", { name: r.continue }));
    await waitFor(() => {
      expect(lookupRegistrationStudentAction).toHaveBeenCalledWith(dniValue);
    });
  }

  function fillStudentNameFields(first = "A", last = "B") {
    const r = dictEn.register;
    fireEvent.change(screen.getByLabelText(r.firstName), {
      target: { value: first },
    });
    fireEvent.change(screen.getByLabelText(r.lastName), { target: { value: last } });
  }

  async function fillAndSubmit() {
    const r = dictEn.register;
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(r.firstName)).toBeInTheDocument();
    });
    fillStudentNameFields();
    pickRegisterBirthIso("2000-06-15");
    fireEvent.change(screen.getByLabelText(r.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(r.phone), {
      target: { value: "+100" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
  }

  it("keeps an autofilled document after Continue", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    const input = screen.getByLabelText(dictEn.register.dni) as HTMLInputElement;
    input.value = "87654321";
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.continue }));
    await waitFor(() => {
      expect(lookupRegistrationStudentAction).toHaveBeenCalledWith("87654321");
    });
    await waitFor(() => {
      expect((screen.getByLabelText(dictEn.register.dni) as HTMLInputElement).value).toBe("87654321");
    });
  });

  it("restores the document and details step after a remount", async () => {
    writeRegisterDniDraft(registerDniDraftKey("es", "reserve"), {
      dni: "12345678",
      step: "details",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });
    expect((screen.getByLabelText(dictEn.register.dni) as HTMLInputElement).value).toBe("12345678");
  });

  it("asks only for DNI on Step 1 and keeps student fields editable after Continue", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    expect(screen.getByLabelText(dictEn.register.dni)).toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.register.firstName)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.continue })).toBeInTheDocument();

    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });

    const dniInput = screen.getByLabelText(dictEn.register.dni) as HTMLInputElement;
    const firstInput = screen.getByLabelText(dictEn.register.firstName) as HTMLInputElement;
    expect(dniInput.readOnly).toBe(false);
    expect(firstInput.readOnly).toBe(false);

    fireEvent.change(dniInput, { target: { value: "87654321" } });
    expect(dniInput.value).toBe("87654321");
  });

  it("opens success dialog on ok", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).toHaveBeenCalledWith(
      "es",
      expect.objectContaining({
        first_name: "A",
        last_name: "B",
        dni: "12345678",
        email: "a@b.co",
        phone: "+100",
        birth_date: "2000-06-15",
        preferred_section_id: SECTION_ID,
        privacy_accepted: true,
      }),
    );
  });

  it("leaves the privacy checkbox unchecked until the parent ticks it", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("link", { name: dictEn.register.privacyConsent.link })).toHaveAttribute(
      "href",
      "/es/privacidad",
    );
  });

  it("shows closed copy when server returns closed", async () => {
    submitPublicRegistration.mockResolvedValue({
      ok: false,
      message: dictEn.register.closed,
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.closed);
    });
  });

  it("shows validation copy when server returns validation message", async () => {
    submitPublicRegistration.mockResolvedValue({
      ok: false,
      message: dictEn.register.validationError,
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.validationError);
    });
  });

  it("shows generic error for other failures", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: false, message: undefined });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.error);
    });
  });

  it("shows tutor fields when a new minor picks birth date on details step", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });
    fillStudentNameFields("Ch", "Lo");
    pickRegisterBirthIso("2015-01-01");
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.tutorSectionTitle)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(dictEn.register.email)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.register.phone)).not.toBeInTheDocument();
    expect(
      screen.getByText(dictEn.register.studentEmailNotCollectedMinorLead),
    ).toBeInTheDocument();
  });

  it("submits minor flow without student email field", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    const r = dictEn.register;
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(r.firstName)).toBeInTheDocument();
    });
    fillStudentNameFields("Ch", "Lo");
    pickRegisterBirthIso("2015-01-01");
    await waitFor(() => {
      expect(screen.getByLabelText(r.tutorName)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(r.tutorName), {
      target: { value: "María" },
    });
    fireEvent.change(screen.getByLabelText(r.tutorDni), { target: { value: "999" } });
    fireEvent.change(screen.getByLabelText(r.tutorEmail), {
      target: { value: "tutor@example.com" },
    });
    fireEvent.change(screen.getByLabelText(r.tutorPhone), {
      target: { value: "+200" },
    });
    fireEvent.change(screen.getByLabelText(r.tutorRelationship), {
      target: { value: "Madre" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).toHaveBeenCalledWith(
      "es",
      expect.objectContaining({
        email: "",
        phone: "",
        birth_date: "2015-01-01",
        tutor_email: "tutor@example.com",
        tutor_phone: "+200",
      }),
    );
  });

  it("hides the section combo and submits the only open section", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    const r = dictEn.register;
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(r.firstName)).toBeInTheDocument();
    });
    expect(screen.queryByRole("combobox", { name: r.level })).not.toBeInTheDocument();
    expect(screen.queryByText(r.sectionUndecidedOption)).not.toBeInTheDocument();
    expect(
      screen.getByText(r.assignedSectionLine.replace("{section}", SECTION_OPTIONS[0].label)),
    ).toBeInTheDocument();
    fillStudentNameFields();
    pickRegisterBirthIso("2000-06-15");
    fireEvent.change(screen.getByLabelText(r.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(r.phone), {
      target: { value: "+100" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).toHaveBeenCalledWith(
      "es",
      expect.objectContaining({ preferred_section_id: SECTION_ID }),
    );
  });

  it("lists open sections only when show-all is on and two or more exist", async () => {
    const secondId = "00000000-0000-4000-8000-000000000002";
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={[
          ...SECTION_OPTIONS,
          { id: secondId, label: "2026 — B1 Afternoon" },
        ]}
        showAllSections
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });
    expect(screen.getByRole("combobox", { name: dictEn.register.level })).toBeInTheDocument();
    expect(screen.queryByText(dictEn.register.sectionUndecidedOption)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        dictEn.register.assignedSectionLine.replace("{section}", SECTION_OPTIONS[0].label),
      ),
    ).not.toBeInTheDocument();
  });

  it("names the first open section when show-all is off and more than one exists", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={[
          ...SECTION_OPTIONS,
          { id: "00000000-0000-4000-8000-000000000002", label: "2026 — B1 Afternoon" },
        ]}
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });
    expect(screen.queryByRole("combobox", { name: dictEn.register.level })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        dictEn.register.assignedSectionLine.replace("{section}", SECTION_OPTIONS[0].label),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("2026 — B1 Afternoon")).not.toBeInTheDocument();
  });

  it("routes home from success dialog", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(dictEn.register.backHome));
    expect(mockPush).toHaveBeenCalledWith("/es");
  });

  it("pre-fills student and tutor fields and keeps them editable when the document matches an existing minor", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
      birthDate: "2015-01-01",
      phone: "",
      email: "",
      tutorName: "Marta Sosa",
      tutorDni: "22333444",
      tutorEmail: "marta@example.com",
      tutorPhone: "+56999990000",
      tutorRelationship: "Madre",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.existingFoundTitle)).toBeInTheDocument();
    });
    const firstInput = screen.getByLabelText(dictEn.register.firstName) as HTMLInputElement;
    const lastInput = screen.getByLabelText(dictEn.register.lastName) as HTMLInputElement;
    const tutorNameInput = screen.getByLabelText(dictEn.register.tutorName) as HTMLInputElement;
    expect(firstInput.value).toBe("Lucía");
    expect(lastInput.value).toBe("Sosa");
    expect(tutorNameInput.value).toBe("Marta Sosa");
    expect(firstInput.readOnly).toBe(false);

    fireEvent.change(tutorNameInput, { target: { value: "Pedro Sosa" } });
    expect(tutorNameInput.value).toBe("Pedro Sosa");
  });

  it("reaches Nagô extras after an existing student continues from details", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
      birthDate: "2015-01-01",
      phone: "",
      email: "",
      tutorName: "Marta Sosa",
      tutorDni: "22333444",
      tutorEmail: "marta@example.com",
      tutorPhone: "+56999990000",
      tutorRelationship: "Madre",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
        extrasPack="nago"
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.firstName)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("checkbox"));
    const continues = screen.getAllByRole("button", { name: dictEn.register.continue });
    fireEvent.click(continues[continues.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.nagoPack.stepTitle)).toBeInTheDocument();
    });
  });

  it("stays on the DNI step when lookup fails", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({ ok: false });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    await continueFromDniStep("12345678");
    expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.lookupFailed);
    expect(screen.queryByLabelText(dictEn.register.email)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.continue })).toBeInTheDocument();
  });

  it("opens the Nagô extras step after details Continue and allows going Back to edit details", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
        extrasPack="nago"
      />,
    );
    await continueFromDniStep("12345678");
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.email)).toBeInTheDocument();
    });
    fillStudentNameFields();
    pickRegisterBirthIso("2000-06-15");
    fireEvent.change(screen.getByLabelText(dictEn.register.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(dictEn.register.phone), {
      target: { value: "+100" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    const continues = screen.getAllByRole("button", { name: dictEn.register.continue });
    fireEvent.click(continues[continues.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.nagoPack.stepTitle)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.backToPreviousStep }));
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.email)).toBeInTheDocument();
    });
  });
});
