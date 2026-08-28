/**
 * Gateway external reference / commerce order encoding for monthly tuition.
 *
 * Deferred-creation flow links a checkout to the billing *slot*
 * (`tuition:<studentId>:<sectionId>:<year>:<month>[:<parentId>]`) instead of a
 * pre-created `payments` row, so abandoned/failed checkouts never materialize a
 * row. The legacy flow used the bare `payments.id` (UUID) as the reference;
 * both are still parsed so in-flight legacy checkouts reconcile after deploy.
 */

const TUITION_PREFIX = "tuition:";
const TUITION_BUNDLE_PREFIX = "tuition-bundle:";
const ENROLLMENT_PREFIX = "enrollment:";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface MonthlyPaymentSlotRef {
  studentId: string;
  sectionId: string;
  year: number;
  month: number;
  /** Tutor (`parent`) paying for a ward; set on the materialized row's `parent_id`. */
  parentId: string | null;
}

export type MonthlyGatewayReference =
  | { kind: "slot"; slot: MonthlyPaymentSlotRef }
  | { kind: "payment"; paymentId: string }
  | { kind: "bundle"; bundleId: string }
  | { kind: "enrollment"; registrationId: string };

/** Builds the deferred-creation reference that links a checkout to a pre-inscription lead. */
export function buildEnrollmentGatewayReference(registrationId: string): string {
  return `${ENROLLMENT_PREFIX}${registrationId}`;
}

/** Builds the deferred-creation reference that links a checkout to a multi-section bundle. */
export function buildTuitionBundleGatewayReference(bundleId: string): string {
  return `${TUITION_BUNDLE_PREFIX}${bundleId}`;
}

/** Builds the deferred-creation reference that links a checkout to a billing slot. */
export function buildTuitionGatewayReference(slot: MonthlyPaymentSlotRef): string {
  const base = `${TUITION_PREFIX}${slot.studentId}:${slot.sectionId}:${slot.year}:${slot.month}`;
  return slot.parentId ? `${base}:${slot.parentId}` : base;
}

function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

/** Parses a gateway reference back into a billing slot or a legacy payment id. */
export function parseMonthlyGatewayReference(
  raw: string | null | undefined,
): MonthlyGatewayReference | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (value.startsWith(ENROLLMENT_PREFIX)) {
    const registrationId = value.slice(ENROLLMENT_PREFIX.length).trim();
    if (!UUID_RE.test(registrationId)) return null;
    return { kind: "enrollment", registrationId };
  }

  if (value.startsWith(TUITION_BUNDLE_PREFIX)) {
    const bundleId = value.slice(TUITION_BUNDLE_PREFIX.length).trim();
    if (!UUID_RE.test(bundleId)) return null;
    return { kind: "bundle", bundleId };
  }

  if (value.startsWith(TUITION_PREFIX)) {
    const parts = value.slice(TUITION_PREFIX.length).split(":");
    const studentId = parts[0]?.trim() ?? "";
    const sectionId = parts[1]?.trim() ?? "";
    const year = Number(parts[2]);
    const month = Number(parts[3]);
    const parentId = parts[4]?.trim() ?? "";
    if (!studentId || !sectionId || !isValidYear(year) || !isValidMonth(month)) {
      return null;
    }
    return {
      kind: "slot",
      slot: { studentId, sectionId, year, month, parentId: parentId || null },
    };
  }

  if (UUID_RE.test(value)) {
    return { kind: "payment", paymentId: value };
  }

  return null;
}
