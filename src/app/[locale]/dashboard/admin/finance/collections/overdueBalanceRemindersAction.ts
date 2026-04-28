"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";
import { notifyOverdueBalance } from "@/lib/email/billingPaymentEmails";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";
import type { Locale } from "@/types/i18n";

const REMINDER_LIMIT = 200;

const schema = z.object({
  locale: z.string().min(1),
  sectionId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  recipientIds: z.array(z.string().uuid()).min(1).max(REMINDER_LIMIT),
});

function currencyForStudent(stu: SectionCollectionsStudentRow): string {
  for (const c of stu.row.cells) {
    if (c.currency) return c.currency;
  }
  return "USD";
}

export type SendOverdueBalanceRemindersResult =
  | { ok: true; sent: number; skipped: number }
  | { ok: false; message: string };

export async function sendOverdueBalanceRemindersAction(
  input: z.infer<typeof schema>,
): Promise<SendOverdueBalanceRemindersResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }
  const { locale, sectionId, year, recipientIds } = parsed.data;
  const dict = await getDictionary(locale as Locale);
  const errs = dict.actionErrors.admin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: errs.forbidden };
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return { ok: false, message: errs.forbidden };

  const todayMonth = year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12;
  const view = await loadAdminSectionCollectionsView(supabase, sectionId, {
    todayYear: year,
    todayMonth,
  });
  if (!view) return { ok: false, message: errs.invalidId };

  const { data: enrolled } = await supabase
    .from("section_enrollments")
    .select("student_id")
    .eq("section_id", sectionId)
    .eq("status", "active")
    .in("student_id", recipientIds);
  const enrolledSet = new Set(
    ((enrolled ?? []) as { student_id: string }[]).map((r) => r.student_id),
  );
  const byId = new Map(view.students.map((s) => [s.studentId, s] as const));

  let sent = 0;
  let skipped = 0;
  for (const id of recipientIds) {
    if (!enrolledSet.has(id)) {
      skipped += 1;
      continue;
    }
    const stu = byId.get(id);
    if (!stu || !stu.hasOverdue || stu.overdue <= 0) {
      skipped += 1;
      continue;
    }
    try {
      await notifyOverdueBalance({
        studentId: id,
        locale: locale as Locale,
        sectionName: view.sectionName,
        amount: stu.overdue,
        currency: currencyForStudent(stu),
        year: view.year,
      });
      sent += 1;
    } catch {
      skipped += 1;
    }
  }

  await recordSystemAudit({
    action: "collections_overdue_email",
    resourceType: "academic_section",
    resourceId: sectionId,
    payload: { year, sent, skipped },
  });

  revalidatePath(`/${locale}/dashboard/admin/finance/collections/${sectionId}`);

  return { ok: true, sent, skipped };
}
