import {
  remintTrialConvertTokenAction,
  resendTrialConvertInviteAction,
} from "@/app/[locale]/dashboard/teacher/sections/trialSeatAttendanceActions";
import { trialConvertInviteIsLive } from "@/lib/register/trialConvertInviteIsLive";

export async function startAdminRegistrationJoinCharge(input: {
  locale: string;
  registrationId: string;
  trialConvertToken?: string | null;
  trialConvertExpiresAt?: string | null;
}): Promise<{ ok: boolean }> {
  const live = trialConvertInviteIsLive(input);
  return live
    ? resendTrialConvertInviteAction({
        locale: input.locale,
        registrationId: input.registrationId,
      })
    : remintTrialConvertTokenAction({
        locale: input.locale,
        registrationId: input.registrationId,
      });
}
