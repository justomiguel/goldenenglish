/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parseRegistrationInboxFilter,
  registrationInboxOrFilter,
} from "@/lib/register/registrationInboxFilter";

describe("parseRegistrationInboxFilter", () => {
  it("defaults to urgent", () => {
    expect(parseRegistrationInboxFilter(undefined)).toBe("urgent");
    expect(parseRegistrationInboxFilter("nope")).toBe("urgent");
  });

  it("keeps contacted from the legacy status query", () => {
    expect(parseRegistrationInboxFilter("contacted", "contacted")).toBe("contacted");
  });
});

describe("registrationInboxOrFilter", () => {
  it("builds the urgent set without waiting-payment none+total", () => {
    const or = registrationInboxOrFilter("urgent");
    expect(or).toContain("receipt_pending");
    expect(or).toContain("needs_section");
    expect(or).toContain("section_full");
    expect(or).toContain("intake_state.eq.none");
  });

  it("includes corrupt none+total in awaiting_fee", () => {
    expect(registrationInboxOrFilter("awaiting_fee")).toContain("fee_snapshot->>total.gt.0");
  });

  it("filters trial leads by intent", () => {
    expect(parseRegistrationInboxFilter("trial")).toBe("trial");
    expect(registrationInboxOrFilter("trial")).toBe("intent.eq.trial");
  });
});
