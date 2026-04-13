import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { redirect } from "next/navigation";
import { BillingPortalEntry } from "@/components/billing/BillingPortalEntry";
import type { BillingInvoiceRow } from "@/types/billing";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentBillingPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/student/billing`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_minor")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const isMinor = Boolean(profile?.is_minor);

  const { data: invRows } = !isMinor
    ? await supabase
        .from("billing_invoices")
        .select(
          "id, student_id, amount, due_date, status, description, external_reference_id, created_at, updated_at",
        )
        .eq("student_id", user.id)
        .neq("status", "voided")
        .order("due_date", { ascending: true })
    : { data: [] as BillingInvoiceRow[] };

  const invoices = (invRows ?? []) as BillingInvoiceRow[];

  return (
    <BillingPortalEntry
      title={dict.dashboard.portalBilling.title}
      lead={dict.dashboard.portalBilling.lead}
      locale={locale}
      viewer="student"
      isMinorStudent={isMinor}
      dict={dict.dashboard.portalBilling}
      invoices={invoices}
    />
  );
}
