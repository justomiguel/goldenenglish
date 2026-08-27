import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import { mockPush } from "@/test/navigationMock";

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

    /** Month/year opens the calendar panel; toggling closed would undo that. */

    const ymdAttr = `${y}-${matched[2]}-${dd}`;
    const cell = scope.querySelector(`td[data-day="${ymdAttr}"]`);
    const btn = cell?.querySelector("button");
    if (!(btn instanceof HTMLButtonElement)) {
      throw new Error(`day button missing for ${ymdAttr}`);
    }
    fireEvent.click(btn);
  }

  function fillStudentFields(first = "A", last = "B") {
    const r = dictEn.register;
    fireEvent.change(screen.getByLabelText(r.firstName), {
      target: { value: first },
    });
    fireEvent.change(screen.getByLabelText(r.lastName), { target: { value: last } });
    fireEvent.change(screen.getByLabelText(r.dni), { target: { value: "12345678" } });
  }

  async function continueToDetails() {
    const r = dictEn.register;
    fireEvent.click(screen.getByRole("button", { name: r.continue }));
    await waitFor(() => {
      expect(lookupRegistrationStudentAction).toHaveBeenCalled();
    });
  }

  function chooseSection() {
    fireEvent.click(screen.getByRole("checkbox", { name: SECTION_OPTIONS[0].label }));
  }

  async function fillAndSubmit() {
    const r = dictEn.register;
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByLabelText(r.email)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(r.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(r.phone), {
      target: { value: "+100" },
    });
    chooseSection();
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
  }

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
      }),
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

  it("shows tutor fields when a new minor continues", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields("Ch", "Lo");
    pickRegisterBirthIso("2015-01-01");
    expect(screen.queryByText(dictEn.register.tutorSectionTitle)).not.toBeInTheDocument();
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.tutorSectionTitle)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(dictEn.register.email)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.register.phone)).not.toBeInTheDocument();
    expect(
      screen.getByText(dictEn.register.studentEmailNotCollectedMinorLead),
    ).toBeInTheDocument();
    expect(screen.getByText(dictEn.register.tutorSectionTitle)).toBeInTheDocument();
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
    fillStudentFields("Ch", "Lo");
    pickRegisterBirthIso("2015-01-01");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByLabelText(r.tutorName)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(r.email)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(r.phone)).not.toBeInTheDocument();
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
    chooseSection();
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

  it("submits undecided choice when help-me option is selected", async () => {
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
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByLabelText(r.email)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(r.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(r.phone), {
      target: { value: "+100" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: r.sectionUndecidedOption }));
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).toHaveBeenCalledWith(
      "es",
      expect.objectContaining({ preferred_section_id: REGISTRATION_UNDECIDED_FORM_VALUE }),
    );
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

  it("keeps tutor and submit off the student step", () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    expect(screen.getByRole("button", { name: dictEn.register.continue })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dictEn.register.submit })).not.toBeInTheDocument();
    expect(screen.queryByText(dictEn.register.tutorSectionTitle)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(dictEn.register.email)).not.toBeInTheDocument();
  });

  it("asks to confirm the stored name when the document matches", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.existingFoundTitle)).toBeInTheDocument();
    });
    expect(screen.getByText(dictEn.register.existingFoundTitle)).toBeInTheDocument();
    expect(screen.getByText("Is this Lucía Sosa?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dictEn.register.submit })).not.toBeInTheDocument();
  });

  it("hides tutor after confirming an existing student", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2015-01-01");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: dictEn.register.existingYes })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.existingYes }));
    expect(screen.queryByText(dictEn.register.tutorSectionTitle)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.submit })).toBeInTheDocument();
  });

  it("still reaches Nagô extras after confirming an existing student", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
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
    fillStudentFields();
    pickRegisterBirthIso("2015-01-01");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: dictEn.register.existingYes })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.existingYes }));
    const continues = screen.getAllByRole("button", { name: dictEn.register.continue });
    fireEvent.click(continues[continues.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.nagoPack.stepTitle)).toBeInTheDocument();
    });
  });

  it("does not submit when the match is rejected", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({
      ok: true,
      found: true,
      firstName: "Lucía",
      lastName: "Sosa",
    });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: dictEn.register.existingNo })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.existingNo }));
    expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.existingRejected);
    expect(submitPublicRegistration).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: dictEn.register.submit })).not.toBeInTheDocument();
  });

  it("stays on the student step when lookup fails", async () => {
    lookupRegistrationStudentAction.mockResolvedValue({ ok: false });
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.lookupFailed);
    expect(screen.queryByLabelText(dictEn.register.email)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.continue })).toBeInTheDocument();
  });

  it("does not show the Nagô extras step without a pack", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.email)).toBeInTheDocument();
    });
    expect(screen.queryByText(dictEn.register.nagoPack.stepTitle)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.submit })).toBeInTheDocument();
  });

  it("opens the Nagô extras step after details Continue", async () => {
    render(
      <RegisterForm
        locale="es"
        dict={dictEn.register}
        legalAgeMajority={18}
        sectionOptions={SECTION_OPTIONS}
        extrasPack="nago"
      />,
    );
    fillStudentFields();
    pickRegisterBirthIso("2000-06-15");
    await continueToDetails();
    await waitFor(() => {
      expect(screen.getByLabelText(dictEn.register.email)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(dictEn.register.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(dictEn.register.phone), {
      target: { value: "+100" },
    });
    chooseSection();
    const continues = screen.getAllByRole("button", { name: dictEn.register.continue });
    fireEvent.click(continues[continues.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.nagoPack.stepTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: dictEn.register.submit })).toBeInTheDocument();
  });
});
