import type { EventFormFieldDefinition } from "@/lib/events/types";

export interface EventRegisterErrorCopy {
  insufficientSeats: string;
  tooManyTickets: string;
  soldOut: string;
  packageSoldOut: string;
  packageUnavailable: string;
  companionMissingName: string;
  rateLimited: string;
  eventNotOpen: string;
  eventNotFound: string;
  duplicateDocument: string;
  sectionMembership: string;
  tutorRequired: string;
  tutorEmailInvalid: string;
  flowRequired: string;
  firstNameRequired: string;
  lastNameRequired: string;
  documentRequired: string;
  emailRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  birthDateInvalid: string;
  fieldRequired: string;
  fieldRequiredPlain: string;
  fieldFileTooLarge: string;
  fieldFileTooLargePlain: string;
  fieldFileType: string;
  fieldFileTypePlain: string;
  packageRequired: string;
  multipleTickets: string;
  companionsInvalid: string;
  receiptRequired: string;
  receiptMismatch: string;
  fileMismatch: string;
  server: string;
  invalidBody: string;
  insufficientSeatsPlain: string;
  tooManyTicketsPlain: string;
  seatTaken: string;
  seatCount: string;
  seatInvalid: string;
  seatHold: string;
  minorInvalid: string;
  network: string;
}

const SIMPLE: Record<string, keyof EventRegisterErrorCopy> = {
  rate_limited: "rateLimited",
  event_not_open: "eventNotOpen",
  event_not_found: "eventNotFound",
  duplicate_dni: "duplicateDocument",
  event_section_membership_required: "sectionMembership",
  event_tutor_required: "tutorRequired",
  tutor_email_invalid: "tutorEmailInvalid",
  event_flow_required: "flowRequired",
  first_name_required: "firstNameRequired",
  last_name_required: "lastNameRequired",
  dni_required: "documentRequired",
  email_required: "emailRequired",
  email_invalid: "emailInvalid",
  phone_required: "phoneRequired",
  birth_date_required: "birthDateInvalid",
  birth_date_invalid: "birthDateInvalid",
  package_required: "packageRequired",
  package_not_found: "packageUnavailable",
  package_not_allowed: "packageUnavailable",
  package_sold_out: "packageSoldOut",
  multiple_tickets_not_allowed: "multipleTickets",
  companion_name_required: "companionMissingName",
  invalid_companions: "companionsInvalid",
  receipt_required: "receiptRequired",
  receipt_path_mismatch: "receiptMismatch",
  file_path_mismatch: "fileMismatch",
  server_error: "server",
  rpc_error: "server",
  rpc_empty: "server",
  invalid_body: "invalidBody",
  unknown_field: "invalidBody",
  seat_already_taken: "seatTaken",
  seat_count_mismatch: "seatCount",
  invalid_seat: "seatInvalid",
  seat_hold_required: "seatHold",
  hold_failed: "seatHold",
  claim_failed: "seatHold",
  lock_failed: "seatHold",
  minor_count_invalid: "minorInvalid",
  minors_not_allowed: "minorInvalid",
  minor_price_missing: "minorInvalid",
  network: "network",
};

const FIELD_CODE = /^(required_field_missing|file_too_large|file_mime_not_allowed|unknown_field):([^:]+)$/;

const SUCCESS_CODES = new Set(["confirmed", "payment_pending", "waitlist"]);

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function sentence(
  errors: Partial<EventRegisterErrorCopy> | undefined,
  key: keyof EventRegisterErrorCopy,
  generic: string,
): string {
  const value = errors?.[key]?.trim();
  return value ? value : generic;
}

function seatCount(seats: number | null | undefined): number | null {
  if (typeof seats !== "number" || !Number.isFinite(seats)) return null;
  return Math.max(0, Math.floor(seats));
}

export function eventRegisterFieldLabel(
  fields: Array<Pick<EventFormFieldDefinition, "id" | "fieldKey" | "labelI18n">>,
  locale: string,
  fieldId: string,
): string | null {
  const field = fields.find((item) => item.id === fieldId);
  if (!field) return null;
  const label =
    field.labelI18n[locale]?.trim() ||
    field.labelI18n.es?.trim() ||
    field.labelI18n.en?.trim() ||
    field.labelI18n.pt?.trim();
  return label || field.fieldKey;
}

export function eventRegisterFailureMessage(input: {
  code: string | null | undefined;
  generic: string;
  errors?: Partial<EventRegisterErrorCopy>;
  seats?: number | null;
  fieldLabel?: string | null;
  overrides?: Record<string, string>;
}): string {
  const code = input.code?.trim() ?? "";
  const override = input.overrides?.[code]?.trim();
  if (override) return override;

  const field = FIELD_CODE.exec(code);
  if (field?.[1] === "required_field_missing") {
    return input.fieldLabel
      ? fill(sentence(input.errors, "fieldRequired", input.generic), { field: input.fieldLabel })
      : sentence(input.errors, "fieldRequiredPlain", input.generic);
  }
  if (field?.[1] === "file_too_large") {
    return input.fieldLabel
      ? fill(sentence(input.errors, "fieldFileTooLarge", input.generic), { field: input.fieldLabel })
      : sentence(input.errors, "fieldFileTooLargePlain", input.generic);
  }
  if (field?.[1] === "file_mime_not_allowed") {
    return input.fieldLabel
      ? fill(sentence(input.errors, "fieldFileType", input.generic), { field: input.fieldLabel })
      : sentence(input.errors, "fieldFileTypePlain", input.generic);
  }
  if (field?.[1] === "unknown_field") return sentence(input.errors, "invalidBody", input.generic);

  if (code === "insufficient_seats") {
    const left = seatCount(input.seats);
    if (left === 0) return sentence(input.errors, "soldOut", input.generic);
    if (left == null) return sentence(input.errors, "insufficientSeatsPlain", input.generic);
    return fill(sentence(input.errors, "insufficientSeats", input.generic), { count: String(left) });
  }

  if (code === "too_many_tickets") {
    const max = seatCount(input.seats);
    if (max == null || max < 1) return sentence(input.errors, "tooManyTicketsPlain", input.generic);
    return fill(sentence(input.errors, "tooManyTickets", input.generic), { max: String(max) });
  }

  const key = SIMPLE[code];
  if (!key) return input.generic;
  return sentence(input.errors, key, input.generic);
}

export function explainEventEnrollOutcome(input: {
  httpOk: boolean;
  bodyOk: boolean;
  status?: number;
  code?: string | null;
  resultCode?: string | null;
  seats?: number | null;
  generic: string;
  errors?: Partial<EventRegisterErrorCopy>;
  fields?: Array<Pick<EventFormFieldDefinition, "id" | "fieldKey" | "labelI18n">>;
  locale?: string;
  overrides?: Record<string, string>;
}): { message: string; notifyTakenSeats: boolean } | null {
  const failedHttp = !input.httpOk || !input.bodyOk;
  const resultCode = input.resultCode?.trim() ?? "";
  if (!failedHttp && (!resultCode || SUCCESS_CODES.has(resultCode))) return null;

  const code = failedHttp
    ? input.code?.trim() || (input.status != null && input.status >= 500 ? "server_error" : "invalid_body")
    : resultCode;
  const fieldMatch = FIELD_CODE.exec(code);
  const fieldLabel =
    fieldMatch && input.fields
      ? eventRegisterFieldLabel(input.fields, input.locale ?? "es", fieldMatch[2] ?? "")
      : null;

  return {
    notifyTakenSeats: code === "seat_already_taken",
    message: eventRegisterFailureMessage({
      code,
      generic: input.generic,
      errors: input.errors,
      seats: input.seats,
      fieldLabel,
      overrides: input.overrides,
    }),
  };
}
