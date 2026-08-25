import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const submitPublicRegistration = vi.fn();
const submitSectionLinkRegistration = vi.fn();
const lookupRegistrationStudentAction = vi.fn();

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration: (...args: unknown[]) => submitPublicRegistration(...args),
}));

vi.mock("@/app/[locale]/i/[token]/actions", () => ({
  submitSectionLinkRegistration: (...args: unknown[]) =>
    submitSectionLinkRegistration(...args),
}));

vi.mock("@/app/[locale]/register/lookupRegistrationStudentAction", () => ({
  lookupRegistrationStudentAction: (...args: unknown[]) =>
    lookupRegistrationStudentAction(...args),
}));

vi.mock("@/components/molecules/RegisterSuccessDialog", () => ({
  RegisterSuccessDialog: () => null,
}));

vi.mock("@/components/molecules/RegisterBirthDateDayPicker", () => ({
  RegisterBirthDateDayPicker: ({
    onChange,
  }: {
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("1990-05-04")}>
      set-birth-date
    </button>
  ),
}));

const dict = {
  firstName: "Nombre",
  lastName: "Apellido",
  dni: "DNI",
  documentIdFormatHint: "hint",
  studentSectionTitle: "Datos del alumno",
  continue: "Continuar",
  lookupFailed: "lookup fail",
  existingFoundTitle: "encontrado",
  existingFoundLead: "¿Es {firstName} {lastName}?",
  existingYes: "Sí",
  existingNo: "No",
  existingRejected: "rechazado",
  sectionsTitle: "Secciones",
  sectionsHint: "varias",
  sectionsAlsoJoin: "también",
  email: "Email",
  phone: "Teléfono",
  birthDateIncomplete: "incompleta",
  studentEmailNotCollectedMinorLead: "menor",
  tutorEmailSameAsStudent: "igual",
  tutorSectionTitle: "Tutor",
  tutorSectionLead: "lead",
  tutorName: "Nombre tutor",
  tutorDni: "DNI tutor",
  tutorEmail: "Email tutor",
  tutorPhone: "Tel tutor",
  tutorRelationship: "Relación",
  level: "Sección",
  sectionPlaceholder: "Elegí",
  sectionUndecidedOption: "No sé",
  sectionUndecidedHint: "pista",
  noSectionsAvailable: "sin secciones",
  submit: "Enviar",
  closed: "cerrado",
  error: "error",
  sectionLink: {
    heading: "Te estás inscribiendo en",
    scheduleLabel: "Horario",
    scheduleEmpty: "a confirmar",
    weekdays: {
      sun: "Dom",
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
    },
    seatsRemainingOne: "Queda 1 cupo",
    seatsRemainingMany: "Quedan {count} cupos",
    waitingListNotice: "completo",
    unavailableTitle: "no disponible",
    unavailableInvalid: "inválido",
    unavailableClosed: "cerrado",
    backHome: "inicio",
  },
} as never;

/** RFC 9562-valid v4 fixtures — zod 4 rejects the plan's all-ones / all-nines ids. */
const link = {
  token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  sectionId: "11111111-1111-4111-8111-111111111111",
  sectionName: "Sección B",
  cohortName: "Ciclo 2026",
  scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
  seatsRemaining: 5,
};

async function renderForm(props: Record<string, unknown>) {
  const { RegisterForm } = await import("@/components/register/RegisterForm");
  return render(
    <RegisterForm locale="es" dict={dict} legalAgeMajority={18} {...props} />,
  );
}

describe("RegisterForm in enrollment-link mode", () => {
  beforeEach(() => {
    vi.resetModules();
    submitPublicRegistration.mockReset();
    submitSectionLinkRegistration.mockReset();
    lookupRegistrationStudentAction.mockReset();
    submitPublicRegistration.mockResolvedValue({ ok: true });
    submitSectionLinkRegistration.mockResolvedValue({ ok: true });
    lookupRegistrationStudentAction.mockResolvedValue({ ok: true, found: false });
  });

  it("keeps the public form free of the enrollment card when there is no link", async () => {
    await renderForm({ sectionOptions: [{ id: link.sectionId, label: "Ciclo — B" }] });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(screen.queryByText("Te estás inscribiendo en")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
  });

  it("replaces the select with the fixed card when a link is given", async () => {
    await renderForm({ sectionOptions: [], enrollmentLink: link });
    expect(
      screen.getByRole("group", { name: "Te estás inscribiendo en" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sección B" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("submits through the token action, passing the token", async () => {
    const user = userEvent.setup();
    await renderForm({ sectionOptions: [], enrollmentLink: link });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("DNI"), "12345678");
    await user.click(screen.getByText("set-birth-date"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "3624000000");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(submitPublicRegistration).not.toHaveBeenCalled();
    expect(submitSectionLinkRegistration).toHaveBeenCalledTimes(1);
    const [locale, token, raw] = submitSectionLinkRegistration.mock.calls[0];
    expect(locale).toBe("es");
    expect(token).toBe(link.token);
    expect(raw).toMatchObject({
      first_name: "Ana",
      preferred_section_id: link.sectionId,
    });
  });

  it("still submits through the public action when there is no link", async () => {
    const user = userEvent.setup();
    await renderForm({
      sectionOptions: [{ id: link.sectionId, label: "Ciclo — B" }],
    });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("DNI"), "12345678");
    await user.click(screen.getByText("set-birth-date"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "3624000000");
    await user.click(screen.getByRole("checkbox", { name: "Ciclo — B" }));
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(submitSectionLinkRegistration).not.toHaveBeenCalled();
    expect(submitPublicRegistration).toHaveBeenCalledTimes(1);
  });
});
