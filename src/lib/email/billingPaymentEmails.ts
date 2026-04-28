import { collectRecipientEmailsForStudent } from "@/lib/email/billingEmailRecipients";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type { EmailTemplateKey } from "@/types/emailTemplates";

export function formatBillingPeriodLabel(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export function formatMoneyLabel(
  amount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  const section = dashIfEmpty(opts.sectionName ?? "");
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
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
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
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const periodLabel = formatBillingPeriodLabel(opts.month, opts.year);
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
}): Promise<void> {
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;
  const amountLabel = formatMoneyLabel(opts.amount, opts.currency, opts.locale);
  const periodContext = String(opts.year);
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
    if (!r.ok) {
      logServerException("notifyOverdueBalance:send", new Error(r.error), {
        studentId: opts.studentId,
      });
    }
  }
}
