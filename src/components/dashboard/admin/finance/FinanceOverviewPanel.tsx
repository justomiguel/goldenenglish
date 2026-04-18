import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { loadAdminCohortCollectionsBulk } from "@/lib/billing/loadAdminCohortCollectionsBulk";
import { CohortCollectionsMatrixClient } from "./CohortCollectionsMatrixClient";

interface CohortLite {
  id: string;
  name: string;
  is_current: boolean | null;
  archived_at: string | null;
}

function pickCohort(
  cohorts: CohortLite[],
  requestedId: string | undefined,
): CohortLite | null {
  if (cohorts.length === 0) return null;
  if (requestedId) {
    const match = cohorts.find((c) => c.id === requestedId);
    if (match) return match;
  }
  const current = cohorts.find((c) => c.is_current);
  if (current) return current;
  return cohorts.find((c) => c.archived_at == null) ?? cohorts[0]!;
}

function parseYear(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n < 2000 || n > 2100) return fallback;
  return n;
}

export interface FinanceOverviewPanelProps {
  supabase: SupabaseClient;
  locale: string;
  dict: Dictionary["admin"]["finance"];
  searchParams: { cohort?: string; year?: string };
  baseHref: string;
}

export async function FinanceOverviewPanel({
  supabase,
  locale,
  dict,
  searchParams,
  baseHref,
}: FinanceOverviewPanelProps) {
  const overviewDict = dict.overview;
  const collectionsDict = dict.collections;

  const { data: cohortRows } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at, created_at")
    .order("created_at", { ascending: false });
  const cohorts = (cohortRows ?? []) as CohortLite[];
  const cohort = pickCohort(cohorts, searchParams.cohort);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const year = parseYear(searchParams.year, todayYear);

  const matrix = cohort
    ? await loadAdminCohortCollectionsBulk(supabase, cohort.id, {
        todayYear: year,
        todayMonth: year === todayYear ? todayMonth : 12,
      })
    : null;

  const sectionDrillBaseHref = `${baseHref.replace(/\/$/, "")}/collections`;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {overviewDict.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {overviewDict.lead}
        </p>
      </header>
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
      >
        <input type="hidden" name="tab" value="overview" />
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {overviewDict.filters.cohort}
          </span>
          <select
            name="cohort"
            defaultValue={cohort?.id ?? ""}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {overviewDict.filters.year}
          </span>
          <input
            type="number"
            name="year"
            min={2000}
            max={2100}
            defaultValue={year}
            className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40"
        >
          {overviewDict.filters.applyFilters}
        </button>
      </form>

      {!cohort ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {overviewDict.empty.noCurrentCohort}
        </p>
      ) : matrix === null ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {collectionsDict.errors.loadFailed}
        </p>
      ) : (
        <CohortCollectionsMatrixClient
          matrix={matrix}
          overviewDict={overviewDict}
          collectionsDict={collectionsDict}
          locale={locale}
          sectionHrefBase={sectionDrillBaseHref}
        />
      )}
    </div>
  );
}
