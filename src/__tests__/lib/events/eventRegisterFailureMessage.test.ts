// REGRESSION CHECK: Enrollment failure codes must stay sentences. A generic fallback hides a closed event, a duplicate document, and a missing field.
import { describe, expect, it } from "vitest";
import {
  explainEventEnrollOutcome,
  eventRegisterFailureMessage,
} from "@/lib/events/eventRegisterFailureMessage";

const errors = {
  insufficientSeats: "Quedan {{count}}",
  tooManyTickets: "Máximo {{max}}",
  soldOut: "Agotado",
  packageUnavailable: "Paquete no",
  companionMissingName: "Nombre",
  emailInvalid: "Correo inválido",
  duplicateDocument: "Documento repetido",
  fieldRequired: "Completa {{field}}",
  fieldRequiredPlain: "Completa los campos",
  server: "Servidor",
  invalidBody: "Revisa el formulario",
  insufficientSeatsPlain: "Sin cupo",
  tooManyTicketsPlain: "Demasiadas",
  network: "Sin conexión",
};

const generic = "Genérico";

describe("eventRegisterFailureMessage", () => {
  it("names a known rejection instead of the generic sentence", () => {
    expect(
      eventRegisterFailureMessage({ code: "email_invalid", generic, errors }),
    ).toBe("Correo inválido");
    expect(
      eventRegisterFailureMessage({ code: "duplicate_dni", generic, errors }),
    ).toBe("Documento repetido");
  });

  it("fills the remaining seats and the ticket maximum", () => {
    expect(
      eventRegisterFailureMessage({ code: "insufficient_seats", generic, errors, seats: 2 }),
    ).toBe("Quedan 2");
    expect(
      eventRegisterFailureMessage({ code: "insufficient_seats", generic, errors, seats: 0 }),
    ).toBe("Agotado");
    expect(
      eventRegisterFailureMessage({ code: "too_many_tickets", generic, errors, seats: 4 }),
    ).toBe("Máximo 4");
    expect(
      eventRegisterFailureMessage({ code: "too_many_tickets", generic, errors }),
    ).toBe("Demasiadas");
  });

  it("names the extra field when the code carries its id", () => {
    expect(
      eventRegisterFailureMessage({
        code: "required_field_missing:field-1",
        generic,
        errors,
        fieldLabel: "Colegio",
      }),
    ).toBe("Completa Colegio");
  });

  it("prefers an override such as a discount sentence", () => {
    expect(
      eventRegisterFailureMessage({
        code: "invalid_code",
        generic,
        errors,
        overrides: { invalid_code: "Código no" },
      }),
    ).toBe("Código no");
  });

  it("keeps the generic sentence for an unknown code", () => {
    expect(eventRegisterFailureMessage({ code: "mystery", generic, errors })).toBe(generic);
  });
});

describe("explainEventEnrollOutcome", () => {
  it("does not treat a saved registration as a failure", () => {
    expect(
      explainEventEnrollOutcome({
        httpOk: true,
        bodyOk: true,
        resultCode: "payment_pending",
        generic,
        errors,
      }),
    ).toBeNull();
  });

  it("explains a database rejection that still returns HTTP 200", () => {
    expect(
      explainEventEnrollOutcome({
        httpOk: true,
        bodyOk: true,
        resultCode: "duplicate_dni",
        generic,
        errors,
      }),
    ).toEqual({ message: "Documento repetido", notifyTakenSeats: false });
  });

  it("explains an HTTP rejection and a server failure", () => {
    expect(
      explainEventEnrollOutcome({
        httpOk: false,
        bodyOk: false,
        status: 400,
        code: "email_invalid",
        generic,
        errors,
      })?.message,
    ).toBe("Correo inválido");
    expect(
      explainEventEnrollOutcome({
        httpOk: false,
        bodyOk: false,
        status: 500,
        generic,
        errors,
      })?.message,
    ).toBe("Servidor");
  });
});
