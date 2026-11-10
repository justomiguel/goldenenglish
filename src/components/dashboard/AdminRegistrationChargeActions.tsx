"use client";

import { Button } from "@/components/atoms/Button";
import { canStartRegistrationJoinCharge } from "@/lib/register/canStartRegistrationJoinCharge";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationChargeActions({
  row,
  labels,
  busy,
  buttonClassName,
  onStartJoinCharge,
}: {
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  buttonClassName: string;
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
}) {
  const canStartJoin = canStartRegistrationJoinCharge(row);
  return (
    <>
      {canStartJoin ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          title={labels.startJoinChargeTip}
          className={buttonClassName}
          disabled={busy}
          onClick={() => onStartJoinCharge(row)}
        >
          {labels.startJoinCharge}
        </Button>
      ) : null}
    </>
  );
}
