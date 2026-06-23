import { describe, expect, it } from "vitest";
import { normalizeEventFormFieldKey } from "@/lib/events/normalizeEventFormFieldKey";
import { listVisibleEventRegistrationBaseFields } from "@/lib/events/eventRegistrationBaseFields";

describe("normalizeEventFormFieldKey", () => {
  it("normalizes human labels to snake_case keys", () => {
    expect(normalizeEventFormFieldKey("School Name")).toEqual({ ok: true, value: "school_name" });
  });

  it("rejects reserved base field keys", () => {
    expect(normalizeEventFormFieldKey("email").ok).toBe(false);
    expect(normalizeEventFormFieldKey("first_name").ok).toBe(false);
  });
});

describe("listVisibleEventRegistrationBaseFields", () => {
  it("hides residency and payment when not applicable", () => {
    const fields = listVisibleEventRegistrationBaseFields({
      showBirthDateField: false,
      showResidencyField: false,
      showPaymentField: false,
    });
    expect(fields.some((field) => field.id === "residency")).toBe(false);
    expect(fields.some((field) => field.id === "payment")).toBe(false);
    expect(fields.some((field) => field.id === "birthDate")).toBe(false);
    expect(fields.some((field) => field.id === "tutor")).toBe(false);
    expect(fields.some((field) => field.id === "firstName")).toBe(true);
  });

  it("shows birth date and tutor when enabled", () => {
    const fields = listVisibleEventRegistrationBaseFields({
      showBirthDateField: true,
      showResidencyField: false,
      showPaymentField: false,
    });
    expect(fields.some((field) => field.id === "birthDate")).toBe(true);
    expect(fields.some((field) => field.id === "tutor")).toBe(true);
  });
});
