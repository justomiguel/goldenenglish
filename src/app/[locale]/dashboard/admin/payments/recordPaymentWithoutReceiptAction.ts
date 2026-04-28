"use server";

import { randomUUID } from "crypto";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary, defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException } from "@/lib/logging/serverActionLog";
import { notifyAdminRecordedPayment } from "@/lib/email/billingPaymentEmails";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordOnePaymentWithoutReceipt } from "@/lib/billing/recordPaymentWithoutReceiptCore";
import { auditFinanceAction } from "@/lib/audit";
import {
  messageForRecordPaymentCode,
  recordPaymentBulkSchema,
  recordPaymentSingleSchema,
  resolveRecordPaymentLocale,
  uniqueSortedMonths,
} from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptActionShared";

export type RecordPaymentWithoutReceiptResult = { ok: true } | { ok: false; message: string };

export type RecordPaymentsWithoutReceiptBulkResult =
  | {
      ok: true;
      recorded: number;
      results: { month: number; ok: boolean; message?: string }[];
      batchId: string;
    }
  | { ok: false; message: string };

export async function recordPaymentWithoutReceipt(
  raw: unknown,
): Promise<RecordPaymentWithoutReceiptResult> {
  let ctx: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    ctx = await assertAdmin();
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.recordPaymentAdmin.forbidden };
  }

  const parsed = recordPaymentSingleSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.recordPaymentAdmin.invalidData };
  }

  const p = parsed.data;
  const { supabase, user: actor } = ctx;
  const ad = await getDictionary(p.locale);
  const k = ad.actionErrors.recordPaymentAdmin;
  const locale = resolveRecordPaymentLocale(p.locale);
  const note = p.adminNote?.trim() || null;
  const batchId = randomUUID();

  const r = await recordOnePaymentWithoutReceipt(supabase, {
    studentId: p.studentId,
    sectionId: p.sectionId,
    year: p.year,
    month: p.month,
    adminNote: note,
    actorId: actor.id,
    correlationId: batchId,
  });

  if (!r.success) {
    return { ok: false, message: messageForRecordPaymentCode(k, r.code) };
  }

  revalidateStudentBillingPaths(p.locale, p.studentId);

  void recordUserEventServer({
    userId: actor.id,
    eventType: "action",
    entity: AnalyticsEntity.adminRecordedMonthlyPayment,
    metadata: {
      student_id: p.studentId,
      section_id: p.sectionId,
      month: p.month,
      year: p.year,
      batch_id: batchId,
    },
  });

  void (async () => {
    try {
      await notifyAdminRecordedPayment({
        studentId: p.studentId,
        locale,
        month: p.month,
        year: p.year,
        amount: r.amount,
        currency: r.currency,
        sectionName: r.sectionName,
      });
    } catch (err) {
      logServerException("recordPaymentWithoutReceipt:email", err);
    }
  })();

  return { ok: true };
}

export async function recordPaymentsWithoutReceiptBulk(
  raw: unknown,
): Promise<RecordPaymentsWithoutReceiptBulkResult> {
  let ctx: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    ctx = await assertAdmin();
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.recordPaymentAdmin.forbidden };
  }

  const parsed = recordPaymentBulkSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.recordPaymentAdmin.invalidData };
  }

  const p = parsed.data;
  const { supabase, user: actor } = ctx;
  const ad = await getDictionary(p.locale);
  const k = ad.actionErrors.recordPaymentAdmin;
  const ms = uniqueSortedMonths(p.months);
  if (ms.length === 0) {
    return { ok: false, message: k.invalidData };
  }

  const locale = resolveRecordPaymentLocale(p.locale);
  const note = p.adminNote?.trim() || null;
  const batchId = randomUUID();
  const results: { month: number; ok: boolean; message?: string }[] = [];
  let recorded = 0;

  for (const month of ms) {
    const r = await recordOnePaymentWithoutReceipt(supabase, {
      studentId: p.studentId,
      sectionId: p.sectionId,
      year: p.year,
      month,
      adminNote: note,
      actorId: actor.id,
      correlationId: batchId,
    });
    if (r.success) {
      recorded += 1;
      results.push({ month, ok: true });
      void (async () => {
        try {
          await notifyAdminRecordedPayment({
            studentId: p.studentId,
            locale,
            month: r.month,
            year: r.year,
            amount: r.amount,
            currency: r.currency,
            sectionName: r.sectionName,
          });
        } catch (err) {
          logServerException("recordPaymentWithoutReceiptBulk:email", err, { month: r.month });
        }
      })();
    } else {
      results.push({ month, ok: false, message: messageForRecordPaymentCode(k, r.code) });
    }
  }

  if (recorded === 0) {
    return { ok: false, message: k.bulkAllFailed };
  }

  revalidateStudentBillingPaths(p.locale, p.studentId);

  void recordUserEventServer({
    userId: actor.id,
    eventType: "action",
    entity: AnalyticsEntity.adminRecordedMonthlyPayment,
    metadata: {
      student_id: p.studentId,
      section_id: p.sectionId,
      year: p.year,
      batch_id: batchId,
      months_recorded: recorded,
      months_attempted: ms.length,
    },
  });

  const batchAudit = await auditFinanceAction({
    actorId: actor.id,
    actorRole: "admin",
    action: "create",
    resourceType: "payment_batch",
    resourceId: batchId,
    summary: `Bulk recorded ${recorded} monthly payment(s) (no receipt workflow)`,
    afterValues: {
      year: p.year,
      month_count: recorded,
    },
    metadata: {
      student_id: p.studentId,
      section_id: p.sectionId,
      months: results.filter((row) => row.ok).map((row) => row.month),
    },
    correlationId: batchId,
  });
  if (!batchAudit?.ok) {
    logServerException("recordPaymentsWithoutReceiptBulk:batchAudit", new Error("audit_insert_failed"), {
      batchId,
    });
  }

  return { ok: true, recorded, results, batchId };
}
