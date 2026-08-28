"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import {
  approveRegistrationReceiptAction,
  assignRegistrationSectionAction,
  registrationEnrollmentReceiptUrlAction,
  rejectRegistrationReceiptAction,
  waiveRegistrationFeeAction,
} from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";
import { registrationInboxPrimaryKind } from "@/lib/register/registrationInboxPrimaryKind";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type IntakeLabels = Dictionary["admin"]["registrations"]["intake"];

export function AdminRegistrationIntakeActions({
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
  const kind = registrationInboxPrimaryKind(row);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sectionId, setSectionId] = useState(row.preferred_section_id ?? "");
  const [error, setError] = useState<string | null>(null);
  if (!kind || kind === "accept") return null;

  const amount = formatMoneyLabel(row.snapshotTotal ?? 0, row.snapshotCurrency ?? "CLP", locale);
  const legend =
    kind === "waive"
      ? labels.awaitingFee.replace("{{amount}}", amount)
      : kind === "receipt"
        ? labels.receiptPending
        : row.intakeState === "section_full"
          ? labels.sectionFull
          : labels.needsSection;

  async function run(fn: () => Promise<{ ok: boolean; code?: string }>) {
    onBusy(row.id);
    setError(null);
    const res = await fn();
    onBusy(null);
    if (!res.ok) {
      setError(res.code === "section_full" ? labels.sectionFullError : labels.actionError);
      return;
    }
    onDone();
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{legend}</p>
      {kind === "waive" ? (
        <>
          <Label htmlFor={`waive-${row.id}`}>{labels.waiveReason}</Label>
          <Input
            id={`waive-${row.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy || !reason.trim()}
            onClick={() =>
              run(() =>
                waiveRegistrationFeeAction({
                  locale,
                  registrationId: row.id,
                  reason,
                }),
              )
            }
          >
            {labels.waive}
          </Button>
        </>
      ) : null}
      {kind === "receipt" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const res = await registrationEnrollmentReceiptUrlAction(row.id);
              if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
            }}
          >
            {labels.viewReceipt}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(() =>
                approveRegistrationReceiptAction({ locale, registrationId: row.id }),
              )
            }
          >
            {labels.approveReceipt}
          </Button>
          <div className="w-full space-y-1">
            <Label htmlFor={`reject-${row.id}`}>{labels.rejectNote}</Label>
            <Input
              id={`reject-${row.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy || !note.trim()}
              onClick={() =>
                run(() =>
                  rejectRegistrationReceiptAction({
                    locale,
                    registrationId: row.id,
                    note,
                  }),
                )
              }
            >
              {labels.rejectReceipt}
            </Button>
          </div>
        </div>
      ) : null}
      {kind === "assign" ? (
        <>
          <Label htmlFor={`assign-${row.id}`}>{labels.assignSection}</Label>
          <select
            id={`assign-${row.id}`}
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={busy}
          >
            <option value="">—</option>
            {sections
              .filter((s) => s.activeCount < s.maxStudents)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={busy || !sectionId}
            onClick={() =>
              run(() =>
                assignRegistrationSectionAction({
                  locale,
                  registrationId: row.id,
                  sectionId,
                }),
              )
            }
          >
            {labels.assignSection}
          </Button>
        </>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
