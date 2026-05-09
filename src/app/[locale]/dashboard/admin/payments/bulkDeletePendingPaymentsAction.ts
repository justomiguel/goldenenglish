"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditFinanceAction } from "@/lib/audit";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { resolvePaymentActionLocale } from "@/app/[locale]/dashboard/admin/payments/paymentActionLocale";

const bulkDeleteSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1).max(80),
  locale: z.string().min(2).max(8),
});

/** Payment inbox: remove pending rows (e.g. duplicate or mistaken uploads). */
export async function bulkDeletePendingMonthlyPayments(
  raw: unknown,
): Promise<{ ok: boolean; deleted: number; message?: string }> {
  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  let actorId = "";
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("bulkDeletePendingMonthlyPayments");
    const dict = await getDictionary(defaultLocale);
    return { ok: false, deleted: 0, message: dict.actionErrors.paymentsReview.forbidden };
  }

  const parsed = bulkDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, deleted: 0, message: dict.actionErrors.paymentsReview.invalidData };
  }

  const { paymentIds, locale } = parsed.data;
  const errDict = await getDictionary(locale === "en" || locale === "es" ? locale : defaultLocale);

  type PendingRow = {
    id: string;
    student_id: string | null;
    month: number | null;
    year: number | null;
    amount: number | null;
    status: string | null;
    receipt_url: string | null;
  };

  const rows = await chunkedIn<PendingRow>(
    supabase,
    "payments",
    "id",
    paymentIds,
    "id, student_id, month, year, amount, status, receipt_url",
    80,
  );
  const pending = rows.filter((r) => r.status === "pending");
  if (pending.length === 0) {
    return {
      ok: false,
      deleted: 0,
      message: errDict.actionErrors.paymentsReview.nonePendingToDelete,
    };
  }

  let deleted = 0;
  const students = new Set<string>();

  for (const row of pending) {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", row.id)
      .eq("status", "pending");
    if (error) {
      logSupabaseClientError("bulkDeletePendingMonthlyPayments:delete", error, {
        paymentId: row.id,
      });
      continue;
    }
    deleted += 1;
    if (row.student_id) students.add(row.student_id);

    void auditFinanceAction({
      actorId,
      actorRole: "admin",
      action: "delete",
      resourceType: "payment",
      resourceId: row.id,
      summary: "Admin deleted pending payment receipt from inbox queue",
      beforeValues: {
        status: row.status,
        amount: row.amount,
        receipt_url: row.receipt_url,
        month: row.month,
        year: row.year,
        student_id: row.student_id,
      },
      afterValues: {},
      metadata: {
        student_id: row.student_id,
        month: row.month,
        year: row.year,
        source: "payment_inbox_bulk_delete",
      },
    });
  }

  const loc = resolvePaymentActionLocale(locale);
  revalidatePath(`/${loc}/dashboard/admin/finance`);
  for (const sid of students) {
    revalidateStudentBillingPaths(locale, sid);
  }

  return { ok: deleted > 0, deleted };
}
