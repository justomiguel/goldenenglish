import { describe, it, expect } from "vitest";
import type { Dictionary } from "@/types/i18n";
import { appendAuthIncidentReferenceLine } from "@/lib/dashboard/appendAuthIncidentReferenceLine";
import { dictEn } from "@/test/dictEn";
import { mapEnsureParentFailureToUserMessage } from "@/lib/dashboard/mapEnsureParentFailureToUserMessage";

describe("mapEnsureParentFailureToUserMessage", () => {
  const U = dictEn.admin.users;

  it("maps tutor auth issue codes through guardian-scoped invite copy", () => {
    expect(mapEnsureParentFailureToUserMessage(dictEn, "tutor_auth_invalid_email")).toBe(
      U.inviteAuthGuardianInvalidEmail,
    );
    expect(mapEnsureParentFailureToUserMessage(dictEn, "tutor_auth_email_exists")).toBe(
      U.inviteAuthGuardianEmailExists,
    );
    expect(mapEnsureParentFailureToUserMessage(dictEn, "tutor_auth_no_user_returned")).toBe(
      U.inviteAuthGuardianNoUserReturned,
    );
  });

  it("appends correlation line for tutor_auth_unexpected when incident ref supplied", () => {
    const ref = "11111111-1111-4111-8111-111111111111";
    expect(mapEnsureParentFailureToUserMessage(dictEn, "tutor_auth_unexpected", ref)).toBe(
      appendAuthIncidentReferenceLine(dictEn as Dictionary, U.inviteAuthGuardianUnexpected, ref),
    );
  });
});
