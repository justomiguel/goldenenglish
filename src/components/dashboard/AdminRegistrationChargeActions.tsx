"use client";

import { Button } from "@/components/atoms/Button";
import { canStartRegistrationEnrollmentFeeFlow } from "@/lib/register/canStartRegistrationEnrollmentFeeFlow";
import { canStartRegistrationJoinCharge } from "@/lib/register/canStartRegistrationJoinCharge";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationChargeActions({
  row,
  labels,
  busy,
  buttonClassName,
  onStartEnrollmentFee,
  onStartJoinCharge,
}: {
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  buttonClassName: string;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
}) {
  const canStartFee = canStartRegistrationEnrollmentFeeFlow(row);
  const canStartJoin = canStartRegistrationJoinCharge(row);
  return (
    <>
      {canStartFee ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          title={labels.startEnrollmentFeeFlowTip}
          className={buttonClassName}
          disabled={busy}
          onClick={() => onStartEnrollmentFee(row)}
        >
          {labels.startEnrollmentFeeFlow}
        </Button>
      ) : null}
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
