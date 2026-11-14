import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

export type RegistrationMatriculaLine =
  | "mercadopago"
  | "receipt_pending"
  | "in_person"
  | "approved_without_section";

export function matriculaBlocksManualAlta(row: {
  chargesEnrollmentFee?: boolean;
  snapshotTotal?: number;
  feeCaptured?: boolean;
}): boolean {
  const due = row.chargesEnrollmentFee === true || (row.snapshotTotal ?? 0) > 0;
  return due && row.feeCaptured !== true;
}

export function registrationMatriculaAmount(input: {
  cohortAmount: number;
  sectionAmount: number;
  snapshotTotal: number;
}): number {
  if (input.cohortAmount > 0) return input.cohortAmount;
  if (input.sectionAmount > 0) return input.sectionAmount;
  if (input.snapshotTotal > 0) return input.snapshotTotal;
  return 0;
}

export function registrationMatriculaLines(row: {
  status: string;
  intakeState?: RegistrationIntakeState;
  feeCaptured?: boolean;
  enrollmentFeePaidMethod?: string | null;
  enrollmentFeeReceiptPath?: string | null;
  acceptedStudentId?: string | null;
}): RegistrationMatriculaLine[] {
  const lines: RegistrationMatriculaLine[] = [];
  if (row.intakeState === "receipt_pending" && row.enrollmentFeeReceiptPath) {
    lines.push("receipt_pending");
  }
  if (row.enrollmentFeePaidMethod === "gateway") lines.push("mercadopago");
  if (row.enrollmentFeePaidMethod === "cash") lines.push("in_person");
  if (
    row.acceptedStudentId &&
    row.status !== "enrolled" &&
    row.intakeState === "needs_section"
  ) {
    lines.push("approved_without_section");
  }
  return lines;
}

export function registrationSectionAssignCohort(input: {
  preferredSectionId: string | null;
  preferredCohortId: string | null;
  sectionCohortId: string | null;
}): { ok: true } | { ok: false; code: "no_cohort" | "section_cohort_mismatch" } {
  if (!input.sectionCohortId) return { ok: false, code: "no_cohort" };
  if (!input.preferredSectionId) return { ok: true };
  if (!input.preferredCohortId) return { ok: false, code: "no_cohort" };
  if (!sectionMatchesRegisteredCohort(input.sectionCohortId, input.preferredCohortId)) {
    return { ok: false, code: "section_cohort_mismatch" };
  }
  return { ok: true };
}

export function sectionMatchesRegisteredCohort(
  sectionCohortId: string | null | undefined,
  registeredCohortId: string | null | undefined,
): boolean {
  if (!sectionCohortId || !registeredCohortId) return false;
  return sectionCohortId === registeredCohortId;
}

export function sectionAssignedRegistrationWrite(): {
  status: "enrolled";
  intake_state: "none";
} {
  return { status: "enrolled", intake_state: "none" };
}

export function cohortSectionChoices(
  cohortId: string | null | undefined,
  byCohort: Record<string, { id: string; label: string }[]> | undefined,
): { id: string; label: string }[] {
  if (!cohortId || !byCohort) return [];
  return (byCohort[cohortId] ?? []).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function cohortIdBySection(
  rows: ReadonlyArray<{ id?: unknown; cohort_id?: unknown }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : "";
    const cohortId = typeof row.cohort_id === "string" ? row.cohort_id : "";
    if (id && cohortId) map.set(id, cohortId);
  }
  return map;
}

export function registrationMatriculaFailureMessage(
  code: string,
  sentences: Record<string, string | undefined>,
  unknownTemplate: string,
): string {
  const known = sentences[code];
  if (known) return known;
  return unknownTemplate.replaceAll("{{code}}", code);
}
