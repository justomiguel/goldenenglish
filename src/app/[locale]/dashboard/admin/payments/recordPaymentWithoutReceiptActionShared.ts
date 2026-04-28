import { z } from "zod";
import type { RecordPaymentWithoutReceiptErrorCode } from "@/lib/billing/recordPaymentWithoutReceiptCore";
import type { Dictionary, Locale } from "@/types/i18n";
import { defaultLocale } from "@/lib/i18n/dictionaries";

export const recordPaymentSingleSchema = z.object({
  studentId: z.string().uuid(),
  sectionId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  locale: z.string().min(2).max(8),
  adminNote: z.string().max(2000).optional(),
});

export const recordPaymentBulkSchema = z.object({
  studentId: z.string().uuid(),
  sectionId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  months: z
    .array(z.number().int().min(1).max(12))
    .min(1)
    .max(12),
  locale: z.string().min(2).max(8),
  adminNote: z.string().max(2000).optional(),
});

export function resolveRecordPaymentLocale(s: string): Locale {
  return s === "en" || s === "es" ? s : (defaultLocale as Locale);
}

export function messageForRecordPaymentCode(
  d: Dictionary["actionErrors"]["recordPaymentAdmin"],
  code: RecordPaymentWithoutReceiptErrorCode,
): string {
  switch (code) {
    case "not_a_student":
      return d.notAStudent;
    case "not_enrolled":
      return d.notEnrolledInSection;
    case "no_plan":
      return d.noPlan;
    case "out_of_period":
      return d.outOfPeriod;
    case "exempt_or_zero":
      return d.exemptOrZero;
    case "already_approved":
      return d.alreadyApproved;
    case "cannot_override_exempt":
      return d.cannotOverrideExempt;
    case "save_failed":
    default:
      return d.saveFailed;
  }
}

export function uniqueSortedMonths(raw: number[]): number[] {
  return [...new Set(raw)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b);
}
