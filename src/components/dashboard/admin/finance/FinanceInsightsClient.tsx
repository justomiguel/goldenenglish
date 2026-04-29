"use client";

import { useState } from "react";
import { BarChart3, Settings2, Target } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { FinanceMonthlyTrendPoint, FinanceProjection, FinanceReceiptProcessingStats, FinanceSectionRanked } from "@/types/financeAnalytics";
import { FinanceCollectionTrendChart } from "./FinanceCollectionTrendChart";
import { FinanceReceiptProcessingCard } from "./FinanceReceiptProcessingCard";
import { FinanceSectionComparisonChart } from "./FinanceSectionComparisonChart";
import { FinanceProjectionCard } from "./FinanceProjectionCard";
import { FinanceSectionAlertsList } from "./FinanceSectionAlertsList";

type InsightsSubTab = "trends" | "operations" | "projections";

const SUB_TABS: { id: InsightsSubTab; icon: typeof BarChart3 }[] = [
  { id: "trends", icon: BarChart3 },
  { id: "operations", icon: Settings2 },
  { id: "projections", icon: Target },
];

type InsightsDict = Dictionary["admin"]["finance"]["insights"];

export interface FinanceInsightsClientProps {
  trend: FinanceMonthlyTrendPoint[];
  projection: FinanceProjection;
  ranked: FinanceSectionRanked[];
  processingStats: FinanceReceiptProcessingStats | null;
  cohortName: string;
  locale: string;
  dict: InsightsDict;
}

export function FinanceInsightsClient({
  trend,
  projection,
  ranked,
  processingStats,
  cohortName,
  locale,
  dict,
}: FinanceInsightsClientProps) {
  const [active, setActive] = useState<InsightsSubTab>("trends");

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {dict.title}
          <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
            — {cohortName}
          </span>
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {dict.lead}
        </p>
      </header>

      <nav
        aria-label={dict.title}
        className="flex gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-1"
      >
        {SUB_TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            aria-current={active === id ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-[calc(var(--layout-border-radius)-2px)] px-3 py-2 text-sm font-medium transition ${
              active === id
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {dict.tabs[id]}
          </button>
        ))}
      </nav>

      {active === "trends" && (
        <div className="space-y-5">
          <FinanceCollectionTrendChart
            trend={trend}
            locale={locale}
            labels={dict.trend}
          />
          <FinanceSectionComparisonChart
            ranked={ranked}
            locale={locale}
            labels={dict.comparison}
          />
        </div>
      )}

      {active === "operations" && (
        <FinanceReceiptProcessingCard
          stats={processingStats}
          labels={dict.processing}
        />
      )}

      {active === "projections" && (
        <div className="space-y-5">
          <FinanceProjectionCard
            projection={projection}
            locale={locale}
            labels={dict.projection}
          />
          <FinanceSectionAlertsList
            ranked={ranked}
            labels={dict.alerts}
          />
        </div>
      )}
    </div>
  );
}
