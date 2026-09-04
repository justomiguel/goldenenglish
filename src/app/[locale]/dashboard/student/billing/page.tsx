import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { BillingPortalEntry } from "@/components/billing/BillingPortalEntry";
import type { BillingInvoiceRow } from "@/types/billing";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.studentNav.billing);
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentBillingPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { supabase, viewerId } = await requirePortalPageActor(
    locale,
    "student",
    `/${locale}/dashboard/student/billing`,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_minor")
    .eq("id", viewerId)
    .maybeSingle();

  const isMinor = Boolean(profile?.is_minor);

  const { data: invRows } = !isMinor
    ? await supabase
        .from("billing_invoices")
        .select(
          "id, student_id, amount, due_date, status, description, external_reference_id, created_at, updated_at",
        )
        .eq("student_id", viewerId)
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
      fileUploadProgress={dict.common.fileUpload}
      invoices={invoices}
    />
  );
}
