"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import {
  markTrialSeatAttendanceAction,
  remintTrialConvertTokenAction,
  resendTrialConvertInviteAction,
} from "@/app/[locale]/dashboard/teacher/sections/trialSeatAttendanceActions";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"]["trialSeats"];

function statusCopy(
  status: NonNullable<AdminRegistrationRow["trialSeats"]>[number]["status"],
  labels: Labels,
): string {
  if (status === "attended") return labels.attended;
  if (status === "absent") return labels.absent;
  if (status === "released") return labels.released;
  return labels.booked;
}

export function AdminRegistrationTrialSeats({
  locale,
  row,
  labels,
  onDone,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  onDone?: () => void;
}) {
  const seats = row.trialSeats ?? [];
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  if (row.intent !== "trial") return null;

  const convertOk =
    Boolean(row.trialConvertToken) &&
    Boolean(row.trialConvertExpiresAt) &&
    new Date(String(row.trialConvertExpiresAt)).getTime() > Date.now();

  function mark(seatId: string, mark: "present" | "absent", sectionId: string) {
    setMessage(null);
    start(async () => {
      const result = await markTrialSeatAttendanceAction({
        locale,
        seatId,
        mark,
        sectionId,
      });
      if (!result.ok) {
        setMessage(labels.markError);
        return;
      }
      onDone?.();
    });
  }

  function remint() {
    setMessage(null);
    start(async () => {
      const result = await remintTrialConvertTokenAction({
        locale,
        registrationId: row.id,
      });
      setMessage(result.ok ? labels.resendOk : labels.resendError);
      if (result.ok) onDone?.();
    });
  }

  function resend() {
    setMessage(null);
    start(async () => {
      const result = await resendTrialConvertInviteAction({
        locale,
        registrationId: row.id,
      });
      setMessage(result.ok ? labels.resendOk : labels.resendError);
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-semibold text-[var(--color-secondary)]">{labels.title}</p>
      {seats.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="space-y-2">
          {seats.map((seat) => (
            <li
              key={seat.id}
              className="flex flex-col gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm">
                {seat.scheduledOn} · {seat.startTime}–{seat.endTime} · {statusCopy(seat.status, labels)}
                {" · "}
                {seat.status === "booked" || seat.status === "attended"
                  ? labels.cupoHeld
                  : labels.cupoReleased}
              </p>
              <div className="flex flex-wrap gap-2">
                {seat.status === "booked" || seat.status === "absent" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => mark(seat.id, "present", seat.sectionId)}
                  >
                    {labels.present}
                  </Button>
                ) : null}
                {seat.status === "booked" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => mark(seat.id, "absent", seat.sectionId)}
                  >
                    {labels.absent}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(row.trialRefundDueAmount ?? 0) > 0 ? (
        <p className="text-sm font-medium">
          {labels.refundDue.replaceAll(
            "{{amount}}",
            formatMoneyLabel(row.trialRefundDueAmount ?? 0, row.snapshotCurrency ?? "USD", locale),
          )}
        </p>
      ) : null}
      {convertOk ? (
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={resend}>
          {labels.resendInvite}
        </Button>
      ) : row.intent === "trial" && row.status !== "enrolled" ? (
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={remint}>
          {labels.remintInvite}
        </Button>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
