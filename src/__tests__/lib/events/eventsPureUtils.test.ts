import { describe, expect, it } from "vitest";
import { slugifyEventTitle } from "@/lib/events/slugifyEventTitle";
import { resolveAttendeeIsMinor } from "@/lib/events/resolveAttendeeIsMinor";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { computeEventCapacityState } from "@/lib/events/computeEventCapacityState";
import { pickEventFieldLabel } from "@/lib/events/pickEventFieldLabel";
import { buildEventAttendeeUploadPath } from "@/lib/events/buildEventAttendeeUploadPath";
import { buildEventFieldValuesSchema } from "@/lib/events/eventFormFieldsSchema";
import { validateEventAttendeePayload } from "@/lib/events/validateEventAttendeePayload";
import type { EventFormFieldDefinition } from "@/lib/events/types";

describe("events pure utils", () => {
  it("slugifies titles", () => {
    expect(slugifyEventTitle("  Nino & Musica 2026 ")).toBe("nino-musica-2026");
  });

  it("resolves minor age correctly", () => {
    const now = new Date("2026-05-27T00:00:00.000Z");
    expect(resolveAttendeeIsMinor("2010-06-01", 18, now)).toBe(true);
    expect(resolveAttendeeIsMinor("2000-01-01", 18, now)).toBe(false);
    expect(resolveAttendeeIsMinor("bad-date", 18, now)).toBe(false);
  });

  it("formats date and returns empty for invalid values", () => {
    expect(formatEventDate("2026-08-01T15:00:00.000Z", "es-CL")).not.toBe("");
    expect(formatEventDate("invalid-date", "es-CL")).toBe("");
  });

  it("computes capacity state with guardrails", () => {
    expect(
      computeEventCapacityState({
        capacity: 10,
        confirmedCount: 7,
        pendingPaymentCount: 3,
        waitlistCount: 2,
      }),
    ).toEqual({
      occupiedSeats: 10,
      seatsLeft: 0,
      isFull: true,
      waitlistCount: 2,
    });
  });

  it("picks localized labels with fallback", () => {
    const labels = { es: "Nombre", en: "Name" };
    expect(pickEventFieldLabel(labels, "pt", "en")).toBe("Name");
    expect(pickEventFieldLabel(undefined, "es", "en")).toBe("");
  });

  it("builds deterministic upload paths", () => {
    const path = buildEventAttendeeUploadPath({
      eventId: "evt-id",
      attendeeId: "att-id",
      fieldId: "field-id",
      filename: "Comprobante de Pago.pdf",
      mime: "application/pdf",
      now: 123,
    });
    expect(path).toMatch(/^evt-id\/att-id\/field-id\/comprobante-de-pago-.*\.pdf$/);
  });
});

describe("event field value schema", () => {
  const fields: EventFormFieldDefinition[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      fieldKey: "headline",
      fieldType: "text",
      required: true,
      labelI18n: { es: "Titulo" },
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      fieldKey: "receipt",
      fieldType: "file",
      required: false,
      labelI18n: { es: "Comprobante" },
      maxFileSizeBytes: 1000,
      allowedMimeTypes: ["application/pdf"],
    },
  ];

  it("accepts valid entries", () => {
    const schema = buildEventFieldValuesSchema(fields);
    const parsed = schema.parse([
      { fieldId: fields[0]!.id, valueText: "Hola" },
      {
        fieldId: fields[1]!.id,
        fileStoragePath: "a/b/c.pdf",
        fileSizeBytes: 900,
        fileMimeType: "application/pdf",
      },
    ]);
    expect(parsed).toHaveLength(2);
  });

  it("rejects missing required field", () => {
    const schema = buildEventFieldValuesSchema(fields);
    expect(() => schema.parse([])).toThrowError(/required_field_missing/);
  });

  it("rejects too large or unsupported files", () => {
    const schema = buildEventFieldValuesSchema(fields);
    expect(() =>
      schema.parse([
        { fieldId: fields[0]!.id, valueText: "ok" },
        {
          fieldId: fields[1]!.id,
          fileStoragePath: "x/y/z.png",
          fileSizeBytes: 2000,
          fileMimeType: "image/png",
        },
      ]),
    ).toThrow();
  });
});

describe("validateEventAttendeePayload", () => {
  const fields: EventFormFieldDefinition[] = [
    {
      id: "33333333-3333-4333-8333-333333333333",
      fieldKey: "school",
      fieldType: "text",
      required: true,
      labelI18n: { es: "Colegio" },
    },
  ];

  it("requires tutor details for minors", () => {
    expect(() =>
      validateEventAttendeePayload({
        base: {
          firstName: "Ana",
          lastName: "Perez",
          dniOrPassport: "123",
          email: "ana@example.com",
          birthDate: "2012-02-01",
        },
        tutor: {},
        fieldValues: [{ fieldId: fields[0]!.id, valueText: "ABC" }],
        fields,
        legalAgeMajority: 18,
        collectBirthDate: true,
        now: new Date("2026-05-27T00:00:00.000Z"),
      }),
    ).toThrowError(/event_tutor_required/);
  });

  it("accepts adults without tutor data", () => {
    const parsed = validateEventAttendeePayload({
      base: {
        firstName: "Luis",
        lastName: "Diaz",
        dniOrPassport: "987",
        email: "luis@example.com",
        birthDate: "1990-10-10",
      },
      tutor: {},
      fieldValues: [{ fieldId: fields[0]!.id, valueText: "ABC" }],
      fields,
      legalAgeMajority: 18,
      collectBirthDate: true,
      now: new Date("2026-05-27T00:00:00.000Z"),
    });
    expect(parsed.isMinor).toBe(false);
  });

  it("ignores birth date and tutor when collection is disabled", () => {
    const parsed = validateEventAttendeePayload({
      base: {
        firstName: "Ana",
        lastName: "Perez",
        dniOrPassport: "123",
        email: "ana@example.com",
        birthDate: "2012-02-01",
      },
      tutor: {},
      fieldValues: [{ fieldId: fields[0]!.id, valueText: "ABC" }],
      fields,
      legalAgeMajority: 18,
      collectBirthDate: false,
      now: new Date("2026-05-27T00:00:00.000Z"),
    });
    expect(parsed.isMinor).toBe(false);
    expect(parsed.base.birthDate).toBeUndefined();
  });
});
