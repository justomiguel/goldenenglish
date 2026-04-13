import { z } from "zod";

export const TEACHER_TRANSFER_REASON_CODES = [
  "academic_level",
  "schedule",
  "behavior",
  "other",
] as const;

export type TeacherTransferReasonCode = (typeof TEACHER_TRANSFER_REASON_CODES)[number];

export const teacherTransferReasonCodeSchema = z.enum(TEACHER_TRANSFER_REASON_CODES);

export function isTeacherTransferReasonCode(v: string): v is TeacherTransferReasonCode {
  return (TEACHER_TRANSFER_REASON_CODES as readonly string[]).includes(v);
}
