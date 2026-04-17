import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { AdminRegistrationsScreen } from "@/components/organisms/AdminRegistrationsScreen";
import {
  loadCurrentCohort,
  loadCurrentCohortSections,
} from "@/lib/academics/currentCohort";
import {
  loadPaginatedRegistrations,
  type PaginatedRegistrationsParams,
} from "@/lib/dashboard/loadPaginatedRegistrations";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_SORT_KEYS: RegistrationSortKey[] = [
  "name", "dni", "email", "level", "birth", "status", "received",
];

function parseSearchParams(raw: Record<string, string | string[] | undefined>): PaginatedRegistrationsParams {
  const pageStr = typeof raw.page === "string" ? raw.page : "1";
  const q = typeof raw.q === "string" ? raw.q : "";
  const sort = typeof raw.sort === "string" && VALID_SORT_KEYS.includes(raw.sort as RegistrationSortKey)
    ? (raw.sort as RegistrationSortKey)
    : "received";
  const dir = raw.dir === "asc" ? "asc" : "desc";

  return {
    page: Math.max(1, parseInt(pageStr, 10) || 1),
    q,
    sort,
    dir,
  };
}

export default async function AdminRegistrationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSp = await searchParams;
  const dict = await getDictionary(locale);
  const paginationParams = parseSearchParams(rawSp);

  const supabase = await createClient();

  const [result, legalAgeMajority, cohort] = await Promise.all([
    loadPaginatedRegistrations(supabase, paginationParams),
    Promise.resolve(getLegalAgeMajorityFromSystem()),
    loadCurrentCohort(supabase),
  ]);

  const cohortSections = cohort
    ? await loadCurrentCohortSections(supabase)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.registrations.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.admin.registrations.lead}
      </p>
      <AdminRegistrationsScreen
        locale={locale}
        rows={result.rows}
        totalCount={result.totalCount}
        page={result.page}
        pageSize={result.pageSize}
        searchQuery={paginationParams.q ?? ""}
        sortKey={paginationParams.sort ?? "received"}
        sortDir={paginationParams.dir ?? "desc"}
        legalAgeMajority={legalAgeMajority}
        labels={dict.admin.registrations}
        tableLabels={dict.admin.table}
        userLabels={{
          password: dict.admin.users.password,
          passwordHint: dict.admin.users.passwordHint,
        }}
        currentCohortSections={cohortSections}
        currentCohortName={cohort?.name}
      />
    </div>
  );
}
