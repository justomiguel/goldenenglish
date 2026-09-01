"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { proposeRegistrationScheduleAction } from "@/app/[locale]/dashboard/admin/registrations/proposeRegistrationScheduleAction";
import { canProposeRegistrationSchedule } from "@/lib/register/canProposeRegistrationSchedule";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type IntakeLabels = Dictionary["admin"]["registrations"]["intake"];

export function AdminRegistrationProposeSchedule({
  locale,
  row,
  labels,
  sections,
  busy,
  onBusy,
  onDone,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: IntakeLabels;
  sections: CurrentCohortSection[];
  busy: boolean;
  onBusy: (id: string | null) => void;
  onDone: () => void;
}) {
  const options = sections.filter(
    (s) => s.activeCount < s.maxStudents && s.id !== row.preferred_section_id,
  );
  const [proposedId, setProposedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (
    !canProposeRegistrationSchedule({
      status: row.status,
      intakeState: row.intakeState,
      requestedSectionFull: row.requestedSectionFull,
      preferredSectionId: row.preferred_section_id,
      openAlternativeCount: options.length,
    })
  ) {
    return null;
  }

  return (
    <>
      <Label htmlFor={`propose-${row.id}`}>{labels.proposeSchedule}</Label>
      <select
        id={`propose-${row.id}`}
        className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
        value={proposedId}
        onChange={(e) => setProposedId(e.target.value)}
        disabled={busy}
      >
        <option value="">—</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        disabled={busy || !proposedId}
        onClick={() => {
          void (async () => {
            onBusy(row.id);
            setError(null);
            const res = await proposeRegistrationScheduleAction({
              locale,
              registrationId: row.id,
              sectionId: proposedId,
            });
            onBusy(null);
            if (!res.ok) {
              setError(res.code === "section_full" ? labels.sectionFullError : labels.actionError);
              return;
            }
            onDone();
          })();
        }}
      >
        {labels.proposeScheduleCta}
      </Button>
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
