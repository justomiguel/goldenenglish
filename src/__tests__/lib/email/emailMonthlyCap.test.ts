import { describe, expect, it } from "vitest";
import {
  EMAIL_MONTHLY_CAP_DEFAULT,
  acceptEmailMonthlyCapInput,
  emailSendFitsCap,
  readEmailMonthlyCap,
} from "@/lib/email/emailMonthlyCap";

describe("emailMonthlyCap", () => {
  it("allows a send that lands on the cap and refuses one that passes it", () => {
    expect(emailSendFitsCap({ used: 4999, cap: 5000, recipientCount: 1 })).toBe(true);
    expect(emailSendFitsCap({ used: 4999, cap: 5000, recipientCount: 2 })).toBe(false);
  });

  it("reads a missing cap as 5000 and rejects 0 or a negative value", () => {
    expect(readEmailMonthlyCap(undefined)).toBe(EMAIL_MONTHLY_CAP_DEFAULT);
    expect(readEmailMonthlyCap(null)).toBe(5000);
    expect(readEmailMonthlyCap("nope")).toBe(5000);
    expect(acceptEmailMonthlyCapInput(0)).toBeNull();
    expect(acceptEmailMonthlyCapInput(-1)).toBeNull();
    expect(acceptEmailMonthlyCapInput(100001)).toBeNull();
    expect(acceptEmailMonthlyCapInput(5000)).toBe(5000);
  });
});
