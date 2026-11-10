"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { assignRegistrationCohortSectionAction } from "@/app/[locale]/dashboard/admin/registrations/assignRegistrationCohortSectionAction";
import { markRegistrationPaidInPersonAction } from "@/app/[locale]/dashboard/admin/registrations/markRegistrationPaidInPersonAction";
import { canStartRegistrationEnrollmentFeeFlow } from "@/lib/register/canStartRegistrationEnrollmentFeeFlow";
import {
  matriculaBlocksManualAlta,
  registrationMatriculaFailureMessage,
  registrationMatriculaLines,
} from "@/lib/register/registrationMatriculaAlta";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationMatriculaControls({
  locale,
  row,
  labels,
  busy,
  sections,
  onStartEnrollmentFee,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  sections: { id: string; label: string }[];
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = registrationMatriculaLines(row);
  const canPay = canStartRegistrationEnrollmentFeeFlow(row);
  const canAssign = lines.includes("approved_without_section");
  const lineText: Record<(typeof lines)[number], string> = {
    mercadopago: labels.matricula.paidMercadoPago,
    receipt_pending: labels.matricula.receiptPending,
    in_person: labels.matricula.paidInPerson,
    approved_without_section: labels.matricula.approvedWithoutSection,
  };

  async function run(task: () => Promise<{ ok: true } | { ok: false; code: string }>) {
    setLocalBusy(true);
    setError(null);
    const result = await task();
    setLocalBusy(false);
    if (!result.ok) {
      setError(
        registrationMatriculaFailureMessage(
          result.code,
          labels.matricula.errors,
          labels.matricula.unknownError,
        ),
      );
      return;
    }
    router.refresh();
  }

  if (lines.length === 0 && !canPay && !canAssign) return null;

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
      {lines.map((line) => (
        <p key={line} className="text-xs text-[var(--color-foreground)]">
          {lineText[line]}
        </p>
      ))}
      {canPay ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-11 justify-start"
            disabled={busy || localBusy}
            onClick={() => onStartEnrollmentFee(row)}
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {labels.matricula.sendMail}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-11 justify-start"
            disabled={busy || localBusy}
            onClick={() =>
              void run(() =>
                markRegistrationPaidInPersonAction({ locale, registrationId: row.id }),
              )
            }
          >
            <Banknote className="h-4 w-4 shrink-0" aria-hidden />
            {labels.matricula.markInPerson}
          </Button>
        </div>
      ) : null}
      {canAssign ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[var(--color-foreground)]" htmlFor={`assign-${row.id}`}>
            {labels.matricula.assignSection}
          </label>
          <select
            id={`assign-${row.id}`}
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            value={sectionId}
            disabled={busy || localBusy}
            onChange={(event) => setSectionId(event.target.value)}
          >
            <option value="">{labels.matricula.assignPlaceholder}</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="min-h-11 justify-start"
            disabled={busy || localBusy || !sectionId}
            onClick={() =>
              void run(() =>
                assignRegistrationCohortSectionAction({
                  locale,
                  registrationId: row.id,
                  sectionId,
                }),
              )
            }
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            {labels.matricula.saveSection}
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function registrationAltaAllowed(row: AdminRegistrationRow): boolean {
  return !matriculaBlocksManualAlta(row);
}
