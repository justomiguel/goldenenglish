"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { resolvePaymentActionLocale } from "@/app/[locale]/dashboard/admin/payments/paymentActionLocale";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import { reviewEnrollmentFeeReceipt } from "./enrollmentFeeActions";

const bulkReviewEnrollmentReceiptsSchema = z.object({
  locale: z.string().min(2).max(8),
  decision: z.enum(["approved", "rejected"]),
  items: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        enrollmentId: z.string().uuid(),
      }),
    )
    .min(1)
    .max(80),
});

export async function bulkReviewEnrollmentFeeReceipts(
  raw: unknown,
): Promise<{ ok: boolean; processed: number; message?: string }> {
  const errDict = await getDictionary(defaultLocale);
  const b = errDict.actionErrors.billingStudent;

  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("bulkReviewEnrollmentFeeReceipts");
    return { ok: false, processed: 0, message: b.forbidden };
  }

  const parsed = bulkReviewEnrollmentReceiptsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, processed: 0, message: b.invalidData };
  }

  const { locale, decision, items } = parsed.data;
  let processed = 0;
  for (const row of items) {
    const r = await reviewEnrollmentFeeReceipt({
      locale: locale as Locale,
      studentId: row.studentId,
      enrollmentId: row.enrollmentId,
      decision,
    });
    if (r.ok) processed += 1;
  }

  if (processed > 0) {
    const loc = resolvePaymentActionLocale(locale);
    revalidatePath(`/${loc}/dashboard/admin/finance`);
  }

  return { ok: processed > 0, processed };
}
