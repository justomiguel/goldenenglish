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
import { FinanceInboxPanel } from "@/components/dashboard/admin/finance/FinanceInboxPanel";
import { FinanceInsightsPanel } from "@/components/dashboard/admin/finance/FinanceInsightsPanel";
import { FinanceSettingsPanel } from "@/components/dashboard/admin/finance/FinanceSettingsPanel";
import { loadFlowChileGatewayAdminRow } from "@/app/[locale]/dashboard/admin/finance/flowGatewaySettingsActions";
import { loadMercadoPagoGatewayAdminRows } from "@/app/[locale]/dashboard/admin/finance/mercadoPagoGatewaySettingsActions";
import { CohortCollectionsMatrixClient } from "@/components/dashboard/admin/finance/CohortCollectionsMatrixClient";
import { FinanceHubCohortSelector } from "@/components/dashboard/admin/finance/FinanceHubCohortSelector";
import { FinanceHubKpiStrip } from "@/components/dashboard/admin/finance/FinanceHubKpiStrip";
import { loadAdminCohortCollectionsBulk } from "@/lib/billing/loadAdminCohortCollectionsBulk";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { loadEventPaymentsForFinanceKpis } from "@/lib/billing/financeSources/loadEventPaymentsForFinanceKpis";
import { FinanceEventsPaymentsPanel } from "@/components/dashboard/admin/finance/FinanceEventsPaymentsPanel";
import {
  loadFinanceHubPendingCounts,
  parseFinanceHubYear,
  pickFinanceHubCohort,
} from "@/lib/dashboard/finance/loadFinanceHubPendingCounts";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; cohort?: string; year?: string; type?: string }>;
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
  const needsCohortBillingMatrix = tab === "collections" || tab === "insights";

  const [pendingCounts, { data: cohortRows }, billingCurrency, bankTransferInstructions, eventKpis] =
    await Promise.all([
    loadFinanceHubPendingCounts(supabase),
    supabase
      .from("academic_cohorts")
      .select("id, name, is_current, archived_at, created_at")
      .order("created_at", { ascending: false }),
    loadBillingCurrencySetting(supabase),
    loadBankTransferInstructionsSetting(supabase),
    loadEventPaymentsForFinanceKpis(supabase),
  ]);

  const cohorts = cohortRows ?? [];
  const cohort = pickFinanceHubCohort(cohorts, search.cohort);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const year = parseFinanceHubYear(search.year, todayYear);

  const matrix =
    needsCohortBillingMatrix && cohort
      ? await loadAdminCohortCollectionsBulk(supabase, cohort.id, {
          todayYear: year,
          todayMonth: year === todayYear ? todayMonth : 12,
        })
      : null;

  const selectorNode = (
    <FinanceHubCohortSelector
      cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
      selectedCohortId={cohort?.id ?? null}
      year={year}
      currentTab={tab}
      dict={financeDict.overview.filters}
    />
  );

  const kpiNode = matrix ? (
    <FinanceHubKpiStrip
      kpis={matrix.totals}
      dict={financeDict.collections.kpis}
      locale={locale}
      currency={billingCurrency.currency}
      eventKpis={eventKpis}
    />
  ) : null;

  const flowGatewayDefault = {
    environment: "sandbox" as const,
    enabled: false,
    hasCredentials: false,
  };
  const mercadoPagoGatewayDefault = [
    { countryCode: "CL" as const, environment: "sandbox" as const, enabled: false, hasCredentials: false },
    { countryCode: "AR" as const, environment: "sandbox" as const, enabled: false, hasCredentials: false },
  ];
  const [flowGatewayInitial, mercadoPagoGatewayInitial] =
    tab === "settings"
      ? await Promise.all([
          loadFlowChileGatewayAdminRow().then((row) => row ?? flowGatewayDefault),
          loadMercadoPagoGatewayAdminRows().then((rows) =>
            rows.length > 0 ? rows : mercadoPagoGatewayDefault,
          ),
        ])
      : [flowGatewayDefault, mercadoPagoGatewayDefault];

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
        cohortSelector={selectorNode}
        kpiStrip={kpiNode}
        dict={financeDict.hub}
      >
        {tab === "collections" && matrix ? (
          <CohortCollectionsMatrixClient
            matrix={matrix}
            overviewDict={financeDict.overview}
            collectionsDict={financeDict.collections}
            locale={locale}
            sectionHrefBase={`${baseHref}/collections`}
            totalsCurrency={billingCurrency.currency}
          />
        ) : null}
        {tab === "collections" && !matrix && cohort ? (
          <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {financeDict.collections.errors.loadFailed}
          </p>
        ) : null}
        {tab === "inbox" ? (
          <FinanceInboxPanel
            supabase={supabase}
            locale={locale as Locale}
            dict={dict}
            receiptHrefBase={`${baseHref}/receipts`}
            activeType={search.type}
          />
        ) : null}
        {tab === "insights" ? (
          <FinanceInsightsPanel
            matrix={matrix}
            cohortId={cohort?.id ?? null}
            supabase={supabase}
            locale={locale}
            dict={financeDict}
          />
        ) : null}
        {tab === "events" ? (
          <FinanceEventsPaymentsPanel
            supabase={supabase}
            dict={financeDict.events}
            locale={locale}
          />
        ) : null}
        {tab === "settings" ? (
          <FinanceSettingsPanel
            currentCurrency={billingCurrency.currency}
            currentBankTransferInstructions={bankTransferInstructions.instructions}
            locale={locale}
            dict={financeDict.settings}
            flowGatewayInitial={flowGatewayInitial}
            mercadoPagoGatewayInitial={mercadoPagoGatewayInitial}
          />
        ) : null}
      </FinanceHubTabs>
    </div>
  );
}
