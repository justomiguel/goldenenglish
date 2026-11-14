"use client";

import { useState } from "react";
import {
  markRegistrationContacted,
  revertRegistrationToNew,
} from "@/app/[locale]/dashboard/admin/registrations/actions";
import { startRegistrationEnrollmentFeeFlowAction } from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";
import { registrationFeeMailFailureMessage } from "@/lib/register/registrationFeeMailFailureMessage";
import { startAdminRegistrationJoinCharge } from "@/lib/register/startAdminRegistrationJoinCharge";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

type RegLabels = Dictionary["admin"]["registrations"];

export function useAdminRegistrationRowActions(
  locale: string,
  labels: RegLabels,
  refreshList: () => void,
) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function runStatusChange(
    row: AdminRegistrationRow,
    fn: (l: string, id: string) => Promise<{ ok: boolean; message?: string }>,
  ) {
    setBusyId(row.id);
    setToast(null);
    const res = await fn(locale, row.id);
    setBusyId(null);
    if (res.ok) {
      setToast(labels.statusChangeSuccess);
      refreshList();
    } else {
      setToast(`${labels.statusChangeError}: ${res.message ?? ""}`);
    }
  }

  function onMarkContacted(row: AdminRegistrationRow) {
    return runStatusChange(row, markRegistrationContacted);
  }

  function onRevertToNew(row: AdminRegistrationRow) {
    return runStatusChange(row, revertRegistrationToNew);
  }

  async function onStartEnrollmentFee(row: AdminRegistrationRow) {
    setBusyId(row.id);
    setToast(null);
    const res = await startRegistrationEnrollmentFeeFlowAction({
      locale,
      registrationId: row.id,
    });
    setBusyId(null);
    if (res.ok) {
      setToast(labels.startEnrollmentFeeFlowSuccess);
      refreshList();
      return;
    }
    setToast(
      registrationFeeMailFailureMessage(res.code, {
        noAddress: labels.feeMailNoAddress,
        noLink: labels.feeMailNoLink,
        failed: labels.feeMailFailed,
        noFee: labels.feeMailNoFee,
        saveFailed: labels.feeMailSaveFailed,
        sectionFull: labels.intake.sectionFullError,
        unknown: labels.feeMailUnknown,
      }),
    );
    refreshList();
  }

  async function onStartJoinCharge(row: AdminRegistrationRow) {
    setBusyId(row.id);
    setToast(null);
    const res = await startAdminRegistrationJoinCharge({
      locale,
      registrationId: row.id,
      trialConvertToken: row.trialConvertToken,
      trialConvertExpiresAt: row.trialConvertExpiresAt,
    });
    setBusyId(null);
    setToast(res.ok ? labels.startJoinChargeSuccess : labels.startJoinChargeError);
    if (res.ok) refreshList();
  }

  return {
    busyId,
    setBusyId,
    toast,
    setToast,
    onMarkContacted,
    onRevertToNew,
    onStartEnrollmentFee,
    onStartJoinCharge,
  };
}
