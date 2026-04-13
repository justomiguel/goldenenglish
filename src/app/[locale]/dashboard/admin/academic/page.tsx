import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { AcademicCohortCurrentToggle } from "@/components/molecules/AcademicCohortCurrentToggle";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function cohortEndsBeforeToday(endsOn: string | null, today: string) {
  return Boolean(endsOn && endsOn < today);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicHub.metaTitle,
    robots: { index: false, follow: false },
  };
}

type CohortRow = {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
};

export default async function AcademicHubPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicHub;
  const supabase = await createClient();

  const { data: cohorts } = await supabase
    .from("academic_cohorts")
    .select("id, name, slug, starts_on, ends_on, is_current, created_at")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const list: CohortRow[] = (cohorts ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    starts_on: (c.starts_on as string | null) ?? null,
    ends_on: (c.ends_on as string | null) ?? null,
    is_current: Boolean(c.is_current),
  }));

  const currentCohort = list.find((c) => c.is_current) ?? null;
  const otherActive = list.filter(
    (c) => !c.is_current && !cohortEndsBeforeToday(c.ends_on, today),
  );
  const pastList = list.filter(
    (c) => !c.is_current && cohortEndsBeforeToday(c.ends_on, today),
  );

  const rowLabels = {
    currentBadge: d.table.currentBadge,
    statusPast: d.table.statusPast,
    statusActive: d.table.statusActive,
    setAsCurrent: d.table.setAsCurrent,
    open: d.table.open,
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">{d.lead}</p>
        </div>
        <AcademicHubToolbar locale={locale} dict={d.toolbar} />
      </header>

      {currentCohort ? (
        <section className="overflow-x-hidden rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)]/40 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-primary)]/5 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            {d.table.currentBadge}
          </div>
          <CohortTableRow
            c={currentCohort}
            locale={locale}
            labels={rowLabels}
            today={today}
            isCurrent
          />
        </section>
      ) : null}

      {otherActive.length > 0 || !currentCohort ? (
        <div className="overflow-x-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-3 py-2">{d.table.name}</th>
                <th className="px-3 py-2">{d.table.period}</th>
                <th className="px-3 py-2">{d.table.status}</th>
                <th className="px-3 py-2">{d.table.action}</th>
              </tr>
            </thead>
            <tbody>
              {otherActive.length === 0 && !currentCohort ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-[var(--color-muted-foreground)]">
                    {d.table.empty}
                  </td>
                </tr>
              ) : (
                otherActive.map((c) => (
                  <CohortTableRow key={c.id} c={c} locale={locale} labels={rowLabels} today={today} />
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {pastList.length > 0 ? (
        <details className="overflow-x-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
            {d.table.archivedToggle} ({pastList.length})
          </summary>
          <p className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted-foreground)]">
            {d.table.archivedHint}
          </p>
          <table className="min-w-full text-left text-sm">
            <tbody>
              {pastList.map((c) => (
                <CohortTableRow key={c.id} c={c} locale={locale} labels={rowLabels} today={today} />
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </div>
  );
}

function CohortTableRow({
  c,
  locale,
  labels,
  today,
  isCurrent,
}: {
  c: CohortRow;
  locale: string;
  labels: {
    currentBadge: string;
    statusPast: string;
    statusActive: string;
    setAsCurrent: string;
    open: string;
  };
  today: string;
  isCurrent?: boolean;
}) {
  const isPast = cohortEndsBeforeToday(c.ends_on, today);
  return (
    <div className="flex items-center gap-2 border-t border-[var(--color-border)] px-3 py-2 text-sm first:border-t-0">
      <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-foreground)]">
        {c.name}
      </span>
      <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
        {c.starts_on ?? "—"} → {c.ends_on ?? "—"}
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          isCurrent
            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
            : isPast
              ? "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
              : "bg-[var(--color-accent)]/20 text-[var(--color-foreground)]"
        }`}
      >
        {isCurrent ? labels.currentBadge : isPast ? labels.statusPast : labels.statusActive}
      </span>
      {!isCurrent ? (
        <AcademicCohortCurrentToggle
          cohortId={c.id}
          locale={locale}
          label={labels.setAsCurrent}
        />
      ) : null}
      <Link
        href={`/${locale}/dashboard/admin/academic/${c.id}`}
        className="shrink-0 font-medium text-[var(--color-primary)] hover:underline"
      >
        {labels.open}
      </Link>
    </div>
  );
}
