import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Banknote } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import {
  FinanceHubTabs,
  parseFinanceHubTab,
} from "@/components/dashboard/admin/finance/FinanceHubTabs";
import { FinanceOverviewPanel } from "@/components/dashboard/admin/finance/FinanceOverviewPanel";
import { FinancePaymentsPanel } from "@/components/dashboard/admin/finance/FinancePaymentsPanel";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; cohort?: string; year?: string }>;
}

async function loadPendingCounts(supabase: SupabaseClient) {
  const [{ count: monthlyPayments }, { count: enrollmentFeeReceipts }] = await Promise.all([
    supabase
      .from("payments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("section_enrollments")
      .select("id", { head: true, count: "exact" })
      .eq("enrollment_fee_receipt_status", "pending"),
  ]);
  return {
    payments: (monthlyPayments ?? 0) + (enrollmentFeeReceipts ?? 0),
  };
}

export default async function AdminFinanceHubPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const tab = parseFinanceHubTab(search.tab);
  const baseHref = `/${locale}/dashboard/admin/finance`;
  const financeDict = dict.admin.finance;
  const pendingCounts = await loadPendingCounts(supabase);

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        >
          <Banknote className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {financeDict.hub.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {financeDict.hub.lead}
          </p>
        </div>
      </header>

      <FinanceHubTabs
        current={tab}
        baseHref={baseHref}
        preservedQuery={{ cohort: search.cohort, year: search.year }}
        pendingCounts={pendingCounts}
        dict={financeDict.hub}
      >
        {tab === "overview" ? (
          <FinanceOverviewPanel
            supabase={supabase}
            locale={locale}
            dict={financeDict}
            searchParams={{ cohort: search.cohort, year: search.year }}
            baseHref={baseHref}
          />
        ) : null}
        {tab === "payments" ? (
          <FinancePaymentsPanel
            supabase={supabase}
            locale={locale as Locale}
            dict={dict.admin.payments}
            portalBillingDict={dict.dashboard.portalBilling}
            enrollmentFeeQueueDict={dict.admin.finance.enrollmentFeeQueue}
            emptyValue={dict.common.emptyValue}
            receiptHrefBase={`/${locale}/dashboard/admin/finance/receipts`}
          />
        ) : null}
      </FinanceHubTabs>
    </div>
  );
}
