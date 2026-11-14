import { AdminRegistrationsStatsRow } from "@/components/dashboard/AdminRegistrationsStatsRow";
import { RegistrationCohortSelect } from "@/components/molecules/RegistrationCohortSelect";
import type { RegistrationCohortCardCounts } from "@/lib/register/registrationCohortCardCounts";
import type { Dictionary } from "@/types/i18n";

export function AdminRegistrationsCohortStats({
  locale,
  statsLabels,
  cohortLabel,
  scoped,
  cards,
  headerCounts,
  enrolledCount,
  cohorts,
  selectedCohortId,
}: {
  locale: string;
  statsLabels: Dictionary["admin"]["registrations"]["stats"];
  cohortLabel: string;
  scoped: boolean;
  cards: RegistrationCohortCardCounts;
  headerCounts: { total: number; new: number; contacted: number };
  enrolledCount: number;
  cohorts: readonly { id: string; name: string }[];
  selectedCohortId: string | null;
}) {
  const shown = scoped
    ? cards
    : {
        total: headerCounts.total + enrolledCount,
        pending: headerCounts.new,
        contacted: headerCounts.contacted,
        enrolled: enrolledCount,
      };

  return (
    <AdminRegistrationsStatsRow
      locale={locale}
      labels={statsLabels}
      total={shown.total}
      pending={shown.pending}
      contacted={shown.contacted}
      enrolled={shown.enrolled}
      cohortSelect={
        selectedCohortId && cohorts.length > 0 ? (
          <RegistrationCohortSelect
            label={cohortLabel}
            cohorts={cohorts}
            value={selectedCohortId}
          />
        ) : null
      }
    />
  );
}
