import { collectRecipientEmailsForStudent } from "@/lib/email/billingEmailRecipients";
import { notifyAdminsPaymentPaid } from "@/lib/email/notifyAdminsPurchasePayment";
import { notifyAdminsReceiptPending } from "@/lib/email/notifyAdminsReceiptPending";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type { EmailTemplateKey } from "@/types/emailTemplates";

export function formatBillingPeriodLabel(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";

function dashIfEmpty(s: string): string {
  const t = s.trim();
  return t.length > 0 ? t : "—";
}

export async function notifyPaymentReceiptPending(opts: {
  studentId: string;
  locale: Locale;
  month: number;
  year: number;
  amount: number;
  currency: string;
  sectionName: string | null;
}): Promise<void> {
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
  const section = dashIfEmpty(opts.sectionName ?? "");
  const contextLabel = opts.sectionName?.trim()
    ? `${opts.sectionName.trim()} · ${periodLabel}`
    : periodLabel;
  await notifyAdminsReceiptPending({
    locale: opts.locale,
    kind: "tuition",
    contextLabel,
    studentId: opts.studentId,
    amount: opts.amount,
    currency: opts.currency,
  });
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  for (const to of toList) {
    const r = await sendBrandedEmail({
      to,
      templateKey: "billing.receipt_submitted_pending" as EmailTemplateKey,
      locale: opts.locale,
      vars: { periodLabel, amountLabel, sectionName: section },
    });
    if (!r.ok) {
      logServerException("notifyPaymentReceiptPending:send", new Error(r.error), {
        studentId: opts.studentId,
      });
    }
  }
}

export async function notifyMonthlyPaymentDecision(opts: {
  studentId: string;
  locale: Locale;
  month: number;
  year: number;
  amount: number;
  currency: string;
  decision: "approved" | "rejected";
  adminNotes: string | null;
}): Promise<void> {
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
  if (opts.decision === "approved") {
    await notifyAdminsPaymentPaid({
      locale: opts.locale,
      kind: "tuition",
      contextLabel: periodLabel,
      studentId: opts.studentId,
      amount: opts.amount,
      currency: opts.currency,
    });
  }
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const key =
    opts.decision === "approved"
      ? "billing.monthly_payment_approved"
      : "billing.monthly_payment_rejected";
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  const rejectionNote = dashIfEmpty(opts.adminNotes?.trim() ?? "");
  for (const to of toList) {
    const vars: Record<string, string> =
      opts.decision === "approved"
        ? { periodLabel, amountLabel, rejectionNote: "—" }
        : { periodLabel, amountLabel: "—", rejectionNote };
    const r = await sendBrandedEmail({
      to,
      templateKey: key as EmailTemplateKey,
      locale: opts.locale,
      vars,
    });
    if (!r.ok) {
      logServerException("notifyMonthlyPaymentDecision:send", new Error(r.error), {
        studentId: opts.studentId,
        decision: opts.decision,
      });
    }
  }
}

export async function notifyAdminRecordedPayment(opts: {
  studentId: string;
  locale: Locale;
  month: number;
  year: number;
  amount: number;
  currency: string;
  sectionName: string;
}): Promise<void> {
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
  await notifyAdminsPaymentPaid({
    locale: opts.locale,
    kind: "tuition",
    contextLabel: `${opts.sectionName} · ${periodLabel}`,
    studentId: opts.studentId,
    amount: opts.amount,
    currency: opts.currency,
  });
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  for (const to of toList) {
    const r = await sendBrandedEmail({
      to,
      templateKey: "billing.admin_recorded_monthly_paid" as EmailTemplateKey,
      locale: opts.locale,
      vars: {
        periodLabel,
        amountLabel,
        sectionName: opts.sectionName,
      },
    });
    if (!r.ok) {
      logServerException("notifyAdminRecordedPayment:send", new Error(r.error), {
        studentId: opts.studentId,
      });
    }
  }
}

export async function notifyOverdueBalance(opts: {
  studentId: string;
  locale: Locale;
  sectionName: string;
  amount: number;
  currency: string;
  year: number;
}): Promise<{ outcome: "ok" | "disabled" }> {
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return { outcome: "ok" };
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  const periodContext = String(opts.year);
  let disabled = false;
  for (const to of toList) {
    const r = await sendBrandedEmail({
      to,
      templateKey: "billing.overdue_balance_reminder" as EmailTemplateKey,
      locale: opts.locale,
      vars: {
        sectionName: opts.sectionName,
        amountLabel,
        periodContext,
      },
    });
    if (r.ok && "skipped" in r && r.skipped) {
      disabled = true;
      continue;
    }
    if (!r.ok) {
      logServerException("notifyOverdueBalance:send", new Error(r.error), {
        studentId: opts.studentId,
      });
    }
  }
  return { outcome: disabled ? "disabled" : "ok" };
}
