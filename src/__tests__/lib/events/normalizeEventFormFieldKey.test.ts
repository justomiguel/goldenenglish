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
      showResidencyField: false,
      showPaymentField: false,
    });
    expect(fields.some((field) => field.id === "residency")).toBe(false);
    expect(fields.some((field) => field.id === "payment")).toBe(false);
    expect(fields.some((field) => field.id === "firstName")).toBe(true);
  });
});
