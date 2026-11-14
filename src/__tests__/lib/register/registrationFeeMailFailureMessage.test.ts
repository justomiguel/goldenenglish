import { describe, expect, it } from "vitest";
import { registrationFeeMailFailureMessage } from "@/lib/register/registrationFeeMailFailureMessage";

const labels = {
  noAddress: "No family email. Code: no_family_email",
  noLink: "No pay link. Code: pay_link_missing",
  failed: "Mail failed. Code: mail_failed",
  noFee: "No fee. Code: no_fee",
  saveFailed: "Save failed. Code: save_failed",
  sectionFull: "Section full",
  unknown: "Send this code with the claim. Code: {{code}}",
};

describe("registrationFeeMailFailureMessage", () => {
  it("names a missing family email", () => {
    expect(registrationFeeMailFailureMessage("no_family_email", labels)).toBe(labels.noAddress);
  });

  it("names a failed send", () => {
    expect(registrationFeeMailFailureMessage("mail_failed", labels)).toBe(labels.failed);
  });

  it("shows an unknown code in the message", () => {
    expect(registrationFeeMailFailureMessage("gateway_down", labels)).toContain("gateway_down");
  });
});