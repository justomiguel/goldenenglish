import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadAdminCohortCollectionsOverview } from "@/lib/billing/loadAdminCohortCollectionsOverview";
import { CohortCollectionsOverviewBoard } from "@/components/dashboard/admin/finance/CohortCollectionsOverviewBoard";
import { SectionCollectionsKpisCard } from "@/components/dashboard/admin/finance/SectionCollectionsKpisCard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cohort?: string; year?: string }>;
}

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

export default async function AdminCollectionsOverviewPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const dict = await getDictionary(locale);
  const d = dict.admin.finance.collections;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const { data: cohortRows } = await supabase
    .from("academic_cohorts")
    .select("id, name, is_current, archived_at, created_at")
    .order("created_at", { ascending: false });
  const cohorts = (cohortRows ?? []) as CohortLite[];
  const cohort = pickCohort(cohorts, search.cohort);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const year = parseYear(search.year, todayYear);

  const overview = cohort
    ? await loadAdminCohortCollectionsOverview(supabase, cohort.id, {
        todayYear: year,
        todayMonth: year === todayYear ? todayMonth : 12,
      })
    : null;

  const baseHref = `/${locale}/dashboard/admin/finance/collections`;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {d.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {d.lead}
        </p>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {d.selectCohort}
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
            {d.selectYear}
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
          {dict.dashboard.adminNav.financeCollections}
        </button>
      </form>

      {!cohort ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {d.overview.noCurrentCohort}
        </p>
      ) : overview ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
              {d.overview.totalsTitle}
            </h2>
            <SectionCollectionsKpisCard
              kpis={overview.totals}
              dict={d}
              locale={locale}
            />
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
              {d.overview.sectionsTitle}
            </h2>
            <CohortCollectionsOverviewBoard
              overview={overview}
              dict={d}
              locale={locale}
              baseHref={baseHref}
            />
          </section>
        </>
      ) : (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {d.errors.loadFailed}{" "}
          <Link
            href={baseHref}
            className="text-[var(--color-primary)] underline"
          >
            ↺
          </Link>
        </p>
      )}
    </div>
  );
}
