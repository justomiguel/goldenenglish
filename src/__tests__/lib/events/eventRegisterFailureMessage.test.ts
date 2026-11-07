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
    ).toBe("Correo inválido (email_invalid)");
    expect(
      eventRegisterFailureMessage({ code: "duplicate_dni", generic, errors }),
    ).toBe("Documento repetido (duplicate_dni)");
  });

  it("fills the remaining seats and the ticket maximum", () => {
    expect(
      eventRegisterFailureMessage({ code: "insufficient_seats", generic, errors, seats: 2 }),
    ).toBe("Quedan 2 (insufficient_seats)");
    expect(
      eventRegisterFailureMessage({ code: "insufficient_seats", generic, errors, seats: 0 }),
    ).toBe("Agotado (insufficient_seats)");
    expect(
      eventRegisterFailureMessage({ code: "too_many_tickets", generic, errors, seats: 4 }),
    ).toBe("Máximo 4 (too_many_tickets)");
    expect(
      eventRegisterFailureMessage({ code: "too_many_tickets", generic, errors }),
    ).toBe("Demasiadas (too_many_tickets)");
  });

  it("names the extra field when the code carries its id", () => {
    expect(
      eventRegisterFailureMessage({
        code: "required_field_missing:field-1",
        generic,
        errors,
        fieldLabel: "Colegio",
      }),
    ).toBe("Completa Colegio (required_field_missing:field-1)");
  });

  it("prefers an override such as a discount sentence", () => {
    expect(
      eventRegisterFailureMessage({
        code: "invalid_code",
        generic,
        errors,
        overrides: { invalid_code: "Código no" },
      }),
    ).toBe("Código no (invalid_code)");
  });

  it("keeps an unknown code next to the fallback sentence", () => {
    expect(eventRegisterFailureMessage({ code: "mystery", generic, errors })).toBe(`${generic} (mystery)`);
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
    ).toEqual({ message: "Documento repetido (duplicate_dni)", notifyTakenSeats: false });
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
    ).toBe("Correo inválido (email_invalid)");
    expect(
      explainEventEnrollOutcome({
        httpOk: false,
        bodyOk: false,
        status: 500,
        generic,
        errors,
      })?.message,
    ).toBe("Servidor (server_error)");
  });
});
