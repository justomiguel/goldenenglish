/**
 * Libro mayor de créditos de clase, derivado de `section_attendance` por trigger.
 *
 * `present`, `absent` y `late` consumen una clase; `excused` no consume y genera un derecho a
 * recuperar. La app solo lee estas tablas: el único escritor es `public.sync_class_credit_ledger()`.
 */

import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

/** Estados de asistencia que consumen una clase prepaga. */
export const CLASS_CONSUMING_ATTENDANCE_STATUSES: readonly SectionAttendanceStatusDb[] = [
  "present",
  "absent",
  "late",
];

export interface ClassCreditConsumption {
  id: string;
  attendanceId: string;
  studentId: string;
  enrollmentId: string;
  sectionId: string;
  attendedOn: string;
  year: number;
  month: number;
  credits: number;
  sourceStatus: SectionAttendanceStatusDb;
}

export interface ClassRecoveryCredit {
  id: string;
  originAttendanceId: string;
  studentId: string;
  originEnrollmentId: string;
  originSectionId: string;
  originAttendedOn: string;
  year: number;
  month: number;
}

export interface ClassCreditConsumptionRowDb {
  id: string;
  attendance_id: string;
  student_id: string;
  enrollment_id: string;
  section_id: string;
  attended_on: string;
  year: number;
  month: number;
  credits: number;
  source_status: string;
}

export interface ClassRecoveryCreditRowDb {
  id: string;
  origin_attendance_id: string;
  student_id: string;
  origin_enrollment_id: string;
  origin_section_id: string;
  origin_attended_on: string;
  year: number;
  month: number;
}

function parseAttendanceStatus(raw: unknown): SectionAttendanceStatusDb {
  if (raw === "present" || raw === "absent" || raw === "late" || raw === "excused") return raw;
  return "present";
}

export function mapClassCreditConsumptionRow(
  row: ClassCreditConsumptionRowDb,
): ClassCreditConsumption {
  return {
    id: row.id,
    attendanceId: row.attendance_id,
    studentId: row.student_id,
    enrollmentId: row.enrollment_id,
    sectionId: row.section_id,
    attendedOn: row.attended_on,
    year: Number(row.year),
    month: Number(row.month),
    credits: Number(row.credits),
    sourceStatus: parseAttendanceStatus(row.source_status),
  };
}

export function mapClassRecoveryCreditRow(row: ClassRecoveryCreditRowDb): ClassRecoveryCredit {
  return {
    id: row.id,
    originAttendanceId: row.origin_attendance_id,
    studentId: row.student_id,
    originEnrollmentId: row.origin_enrollment_id,
    originSectionId: row.origin_section_id,
    originAttendedOn: row.origin_attended_on,
    year: Number(row.year),
    month: Number(row.month),
  };
}
