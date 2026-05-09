"use client";

import { useMemo, useState } from "react";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import type { Dictionary } from "@/types/i18n";
import type { CohortCollectionsMatrix } from "@/types/cohortCollectionsMatrix";
import type { SectionCollectionsHealth } from "@/types/sectionCollections";
import { financeCollectionsMatrixLegendLabels } from "./collectionsMatrixLegendLabels";
import { CohortCollectionsMatrixSectionGroup } from "./CohortCollectionsMatrixSectionGroup";
import { CohortCollectionsTotalsStrip } from "./CohortCollectionsTotalsStrip";

type FinanceDict = Dictionary["admin"]["finance"];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const HEALTH_OPTIONS: SectionCollectionsHealth[] = ["healthy", "watch", "critical"];

export interface CohortCollectionsMatrixClientProps {
  matrix: CohortCollectionsMatrix;
  overviewDict: FinanceDict["overview"];
  collectionsDict: FinanceDict["collections"];
  locale: string;
  sectionHrefBase: string;
  totalsCurrency?: string;
}

export function CohortCollectionsMatrixClient({
  matrix,
  overviewDict,
  collectionsDict,
  locale,
  sectionHrefBase,
  totalsCurrency = "USD",
}: CohortCollectionsMatrixClientProps) {
  const [search, setSearch] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<SectionCollectionsHealth | "all">("all");

  const filteredSections = useMemo(() => {
    return matrix.sections.filter((s) => {
      if (sectionFilter !== "all" && s.view.sectionId !== sectionFilter) return false;
      if (healthFilter !== "all" && s.view.kpis.health !== healthFilter) return false;
      return true;
    });
  }, [matrix.sections, sectionFilter, healthFilter]);

  const visibleStudentIds = useMemo<ReadonlySet<string> | null>(() => {
    const trimmed = search.trim();
    if (!trimmed && !onlyOverdue) return null;
    const term = normalize(trimmed);
    const ids = new Set<string>();
    for (const s of filteredSections) {
      for (const stu of s.view.students) {
        const matchesSearch =
          term.length === 0 ||
          normalize(stu.studentName).includes(term) ||
          (stu.documentLabel ? normalize(stu.documentLabel).includes(term) : false);
        const matchesOverdue = !onlyOverdue || stu.hasOverdue;
        if (matchesSearch && matchesOverdue) ids.add(stu.studentId);
      }
    }
    return ids;
  }, [filteredSections, search, onlyOverdue]);

  const monthShort = collectionsDict.monthShort;
  const filtersDict = collectionsDict.filters;
  const healthDict = collectionsDict.health;

  const visibleSectionCount = useMemo(() => {
    if (!visibleStudentIds) return filteredSections.length;
    let n = 0;
    for (const s of filteredSections) {
      if (s.view.students.some((stu) => visibleStudentIds.has(stu.studentId))) n += 1;
    }
    return n;
  }, [filteredSections, visibleStudentIds]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {overviewDict.filters.search}
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={overviewDict.filters.searchPlaceholder}
            className="w-64 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {filtersDict.filterBySection}
          </span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
          >
            <option value="all">{filtersDict.allSections}</option>
            {matrix.sections.map((s) => (
              <option key={s.view.sectionId} value={s.view.sectionId}>
                {s.view.sectionName}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1 text-xs">
          <legend className="font-medium text-[var(--color-foreground)]">
            {filtersDict.filterByHealth}
          </legend>
          <div className="flex gap-1">
            <HealthChip
              value="all"
              label={filtersDict.allHealth}
              active={healthFilter === "all"}
              onClick={() => setHealthFilter("all")}
            />
            {HEALTH_OPTIONS.map((h) => (
              <HealthChip
                key={h}
                value={h}
                label={healthDict[h]}
                active={healthFilter === h}
                onClick={() => setHealthFilter(h)}
              />
            ))}
          </div>
        </fieldset>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          {overviewDict.filters.onlyOverdue}
        </label>
        <div className="ml-auto flex items-end pb-0.5">
          <AdminBillingMatrixLegendModal
            labels={financeCollectionsMatrixLegendLabels(collectionsDict)}
          />
        </div>
      </form>

      <CohortCollectionsTotalsStrip
        totals={matrix.totals}
        overviewDict={overviewDict}
        locale={locale}
        currency={totalsCurrency}
      />

      {filteredSections.length === 0 ? (
        <EmptyBlock label={overviewDict.empty.noSections} />
      ) : visibleSectionCount === 0 ? (
        <EmptyBlock label={overviewDict.empty.noStudentsAfterFilter} />
      ) : (
        <div className="space-y-3">
          {filteredSections.map((s) => (
            <CohortCollectionsMatrixSectionGroup
              key={s.view.sectionId}
              view={s.view}
              monthShort={monthShort}
              overviewDict={overviewDict}
              collectionsDict={collectionsDict}
              locale={locale}
              sectionHref={`${sectionHrefBase}/${s.view.sectionId}`}
              visibleStudentIds={visibleStudentIds}
              currency={totalsCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HealthChip({
  value,
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-health={value}
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/40"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
      {label}
    </p>
  );
}
