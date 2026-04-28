import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { AdminFinanceReceiptReviewClient } from "@/components/billing/AdminFinanceReceiptReviewClient";
import type { BillingInvoiceRow } from "@/types/billing";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; receiptId: string }>;
}

export default async function AdminFinanceReceiptDetailPage({ params }: PageProps) {
  const { locale, receiptId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();

  const { data: rec } = await supabase
    .from("billing_receipts")
    .select("id, status, receipt_storage_path, amount_paid, invoice_id")
    .eq("id", receiptId)
    .maybeSingle();

  if (!rec || (rec as { status: string }).status !== "pending_approval") {
    notFound();
  }

  const row = rec as {
    id: string;
    receipt_storage_path: string;
    amount_paid: number;
    invoice_id: string;
  };

  const { data: inv } = await supabase
    .from("billing_invoices")
    .select(
      "id, student_id, amount, due_date, status, description, external_reference_id, created_at, updated_at",
    )
    .eq("id", row.invoice_id)
    .maybeSingle();

  if (!inv) notFound();

  const invoice = inv as BillingInvoiceRow;
  const { data: prof } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", invoice.student_id)
    .maybeSingle();

  const studentName =
    prof != null
      ? formatProfileSnakeSurnameFirst(prof as { first_name: string; last_name: string }, invoice.student_id)
      : invoice.student_id;

  const signed = await receiptSignedUrlForAdmin(row.receipt_storage_path);
  if (!signed) notFound();

  const isPdf = row.receipt_storage_path.toLowerCase().endsWith(".pdf");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.portalBilling.splitMetaTitle}
      </h1>
      <div className="mt-8">
        <AdminFinanceReceiptReviewClient
          locale={locale}
          receiptId={row.id}
          signedUrl={signed}
          isPdf={isPdf}
          studentName={studentName}
          invoice={invoice}
          amountPaid={Number(row.amount_paid)}
          dict={dict.dashboard.portalBilling}
        />
      </div>
    </div>
  );
}
