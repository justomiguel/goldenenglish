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

export default async function ParentBillingPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/billing`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id);

  const linkedIds = (links ?? []).map((l) => l.student_id as string);
  const { data: profs } = linkedIds.length
    ? await supabase.from("profiles").select("id, is_minor").in("id", linkedIds)
    : { data: [] as { id: string; is_minor: boolean }[] };

  const minorIds = (profs ?? [])
    .filter((p) => p.is_minor)
    .map((p) => p.id as string);

  const { data: invRows } = minorIds.length
    ? await supabase
        .from("billing_invoices")
        .select(
          "id, student_id, amount, due_date, status, description, external_reference_id, created_at, updated_at",
        )
        .in("student_id", minorIds)
        .neq("status", "voided")
        .order("due_date", { ascending: true })
    : { data: [] as BillingInvoiceRow[] };

  const invoices = (invRows ?? []) as BillingInvoiceRow[];

  return (
    <BillingPortalEntry
      title={dict.dashboard.portalBilling.title}
      lead={dict.dashboard.portalBilling.parentLead}
      locale={locale}
      viewer="parent"
      isMinorStudent={false}
      dict={dict.dashboard.portalBilling}
      invoices={invoices}
    />
  );
}
