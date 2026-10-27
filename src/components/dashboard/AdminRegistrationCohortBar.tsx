"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { setRegistrationCohortAction } from "@/app/[locale]/dashboard/admin/settings/actions";
import type { RegistrationCohortConfig } from "@/lib/settings/inscriptionsServer";
import type { Dictionary } from "@/types/i18n";

interface AdminRegistrationCohortBarProps {
  locale: string;
  labels: Dictionary["admin"]["registrations"];
  cohortConfig: RegistrationCohortConfig;
}

export function AdminRegistrationCohortBar({
  locale,
  labels,
  cohortConfig,
}: AdminRegistrationCohortBarProps) {
  const router = useRouter();
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    cohortConfig.configuredCohortId ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (cohortConfig.cohorts.length === 0) return null;

  const currentCohortName = cohortConfig.currentCohort?.name ?? labels.emptyValue;
  const activeCohort =
    (selectedCohortId
      ? cohortConfig.cohorts.find((cohort) => cohort.id === selectedCohortId)
      : cohortConfig.currentCohort) ??
    cohortConfig.activeCohort;
  const activeCohortName = activeCohort?.name ?? currentCohortName;

  async function onChange(nextValue: string) {
    setBusy(true);
    setNotice(null);
    const normalized = nextValue.trim() ? nextValue.trim() : null;
    try {
      const res = await setRegistrationCohortAction(locale, normalized);
      if (res.ok) {
        setSelectedCohortId(nextValue);
        setNotice(labels.publicCohortSaved);
        router.refresh();
      } else {
        setNotice(labels.editError);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <CalendarRange className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <span className="font-semibold text-[var(--color-foreground)]">
          {labels.publicCohortBarTitle}:
        </span>
        <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
          {labels.publicCohortCurrentLabel.replace("{name}", currentCohortName)}
        </span>
        <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
          {labels.publicCohortActiveLabel.replace("{name}", activeCohortName)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="admin-public-reg-cohort-select"
          className="text-xs font-medium text-[var(--color-muted-foreground)]"
        >
          {labels.publicCohortChangeLabel}
        </label>
        <select
          id="admin-public-reg-cohort-select"
          disabled={busy}
          value={selectedCohortId}
          onChange={(e) => void onChange(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--color-foreground)]"
        >
          <option value="">
            {labels.publicCohortFollowCurrent.replace("{name}", currentCohortName)}
          </option>
          {cohortConfig.cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
        {notice ? (
          <span className="text-xs text-[var(--color-muted-foreground)]" role="status">
            {notice}
          </span>
        ) : null}
      </div>
    </section>
  );
}
