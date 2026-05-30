export type EventRegistrationBaseFieldId =
  | "firstName"
  | "lastName"
  | "dniOrPassport"
  | "email"
  | "phone"
  | "birthDate"
  | "consent"
  | "tutor"
  | "residency"
  | "payment";

export type EventRegistrationBaseFieldKind = "required" | "optional" | "conditional";

export interface EventRegistrationBaseFieldMeta {
  id: EventRegistrationBaseFieldId;
  kind: EventRegistrationBaseFieldKind;
}

export const EVENT_REGISTRATION_BASE_FIELDS: EventRegistrationBaseFieldMeta[] = [
  { id: "firstName", kind: "required" },
  { id: "lastName", kind: "required" },
  { id: "dniOrPassport", kind: "required" },
  { id: "email", kind: "required" },
  { id: "phone", kind: "optional" },
  { id: "birthDate", kind: "optional" },
  { id: "consent", kind: "required" },
  { id: "tutor", kind: "conditional" },
  { id: "residency", kind: "conditional" },
  { id: "payment", kind: "conditional" },
];

export function listVisibleEventRegistrationBaseFields(input: {
  showResidencyField: boolean;
  showPaymentField: boolean;
}): EventRegistrationBaseFieldMeta[] {
  return EVENT_REGISTRATION_BASE_FIELDS.filter((field) => {
    if (field.id === "residency") return input.showResidencyField;
    if (field.id === "payment") return input.showPaymentField;
    return true;
  });
}
