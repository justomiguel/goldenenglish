"use server";

import { randomUUID } from "crypto";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException } from "@/lib/logging/serverActionLog";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { auditFinanceAction } from "@/lib/audit";
import { revertOneApprovedPayment } from "@/lib/billing/revertApprovedPaymentCore";
import { recordPaymentBulkSchema, uniqueSortedMonths } from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptActionShared";
import type { Dictionary } from "@/types/i18n";
import type { RevertApprovedPaymentErrorCode } from "@/lib/billing/revertApprovedPaymentCore";

export type RevertApprovedPaymentsBulk =
  | {
      ok: true;
      reverted: number;
      results: { month: number; ok: boolean; message?: string }[];
      batchId: string;
    }
  | { ok: false; message: string };

function messageForRevertCode(
  d: Dictionary["actionErrors"]["recordPaymentAdmin"],
  code: RevertApprovedPaymentErrorCode,
): string {
  switch (code) {
    case "not_a_student":
      return d.notAStudent;
    case "not_found":
      return d.revertNotFound;
    case "not_approved":
      return d.revertNotApproved;
    case "save_failed":
    default:
      return d.saveFailed;
  }
}

export async function revertApprovedPaymentsBulk(raw: unknown): Promise<RevertApprovedPaymentsBulk> {
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

  const note = p.adminNote?.trim() || null;
  const batchId = randomUUID();
  const results: { month: number; ok: boolean; message?: string }[] = [];
  let reverted = 0;

  for (const month of ms) {
    const r = await revertOneApprovedPayment(supabase, {
      studentId: p.studentId,
      sectionId: p.sectionId,
      year: p.year,
      month,
      adminNote: note,
      actorId: actor.id,
      correlationId: batchId,
    });
    if (r.success) {
      reverted += 1;
      results.push({ month, ok: true });
    } else {
      results.push({ month, ok: false, message: messageForRevertCode(k, r.code) });
    }
  }

  if (reverted === 0) {
    return { ok: false, message: k.bulkRevertAllFailed };
  }

  revalidateStudentBillingPaths(p.locale, p.studentId);

  void recordUserEventServer({
    userId: actor.id,
    eventType: "action",
    entity: AnalyticsEntity.adminRevertedMonthlyPayment,
    metadata: {
      student_id: p.studentId,
      section_id: p.sectionId,
      year: p.year,
      batch_id: batchId,
      months_reverted: reverted,
      months_attempted: ms.length,
    },
  });

  const batchAudit = await auditFinanceAction({
    actorId: actor.id,
    actorRole: "admin",
    action: "update",
    resourceType: "payment_batch",
    resourceId: batchId,
    summary: `Bulk reverted ${reverted} monthly payment(s) to pending`,
    afterValues: {
      year: p.year,
      month_count: reverted,
    },
    metadata: {
      student_id: p.studentId,
      section_id: p.sectionId,
      months: results.filter((row) => row.ok).map((row) => row.month),
      kind: "revert_to_pending",
    },
    correlationId: batchId,
  });
  if (!batchAudit?.ok) {
    logServerException("revertApprovedPaymentsBulk:batchAudit", new Error("audit_insert_failed"), {
      batchId,
    });
  }

  return {
    ok: true,
    reverted,
    results,
    batchId,
  };
}
