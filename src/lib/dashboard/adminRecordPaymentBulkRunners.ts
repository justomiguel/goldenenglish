import { recordPaymentsWithoutReceiptBulk } from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptAction";
import { setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions";
import { createStudentScholarship } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import type { Dictionary, Locale } from "@/types/i18n";

export function formatMonthFailureLine(
  locale: Locale,
  month: number,
  message: string | undefined,
): string {
  const short = new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
  return `${String(month).padStart(2, "0")} ${short}: ${message ?? "—"}`;
}

export async function runRecordPaymentPaidBulk(args: {
  studentId: string;
  sectionId: string;
  year: number;
  months: number[];
  locale: Locale;
  adminNote?: string;
  labels: Dictionary["admin"]["billing"];
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const { studentId, sectionId, year, months, locale, adminNote, labels } = args;
  const r = await recordPaymentsWithoutReceiptBulk({
    studentId,
    sectionId,
    year,
    months,
    locale,
    adminNote,
  });
  if (!r.ok) return { ok: false, message: r.message };
  const failed = r.results.filter((row) => !row.ok);
  const summary =
    failed.length === 0
      ? `${labels.recordPaymentBulkResultOk.replace("{count}", String(r.recorded))} ${labels.recordPaymentBatchId.replace("{id}", r.batchId)}`
      : `${labels.recordPaymentBulkResultPartial
          .replace("{ok}", String(r.recorded))
          .replace(
            "{failed}",
            failed.map((row) => formatMonthFailureLine(locale, row.month, row.message)).join("; "),
          )} ${labels.recordPaymentBatchId.replace("{id}", r.batchId)}`;
  return { ok: true, message: summary };
}

export async function runRecordPaymentExemptBulk(args: {
  locale: Locale;
  studentId: string;
  sectionId: string;
  year: number;
  months: number[];
  adminNote: string;
  labels: Dictionary["admin"]["billing"];
}): Promise<{ ok: true; message: string }> {
  const { locale, studentId, sectionId, year, months, adminNote, labels } = args;
  const note = adminNote.trim();
  const failed: { month: number; message?: string }[] = [];
  for (const month of months) {
    const r = await setPeriodExemption({
      locale,
      studentId,
      sectionId,
      year,
      month,
      exempt: true,
      adminNote: note || undefined,
    });
    if (!r.ok) failed.push({ month, message: r.message });
  }
  const ok = months.length - failed.length;
  if (failed.length === 0) {
    return { ok: true, message: labels.recordPaymentBulkExemptResultOk.replace("{count}", String(ok)) };
  }
  const failLines = failed
    .map((row) => formatMonthFailureLine(locale, row.month, row.message))
    .join("; ");
  return {
    ok: true,
    message: labels.recordPaymentBulkExemptResultPartial
      .replace("{ok}", String(ok))
      .replace("{failed}", failLines),
  };
}

export async function runRecordPaymentScholarshipBulk(args: {
  locale: Locale;
  studentId: string;
  sectionId: string;
  year: number;
  months: number[];
  discountPercent: number;
  note?: string;
  labels: Dictionary["admin"]["billing"];
}): Promise<{ ok: true; message: string }> {
  const { locale, studentId, sectionId, year, months, discountPercent, note, labels } = args;
  const failed: { month: number; message?: string }[] = [];
  for (const month of months) {
    const r = await createStudentScholarship({
      locale,
      studentId,
      sectionId,
      discountPercent,
      note,
      validFromYear: year,
      validFromMonth: month,
      validUntilYear: year,
      validUntilMonth: month,
      isActive: true,
    });
    if (!r.ok) failed.push({ month, message: r.message });
  }
  const ok = months.length - failed.length;
  if (failed.length === 0) {
    return {
      ok: true,
      message: labels.recordPaymentBulkScholarshipResultOk.replace("{count}", String(ok)),
    };
  }
  const failLines = failed
    .map((row) => formatMonthFailureLine(locale, row.month, row.message))
    .join("; ");
  return {
    ok: true,
    message: labels.recordPaymentBulkScholarshipResultPartial
      .replace("{ok}", String(ok))
      .replace("{failed}", failLines),
  };
}
