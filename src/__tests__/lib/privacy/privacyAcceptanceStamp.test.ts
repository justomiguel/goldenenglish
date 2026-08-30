import { describe, expect, it } from "vitest";
import {
  PRIVACY_POLICY_VERSION,
  privacyAcceptanceStamp,
} from "@/lib/privacy/privacyAcceptanceStamp";

describe("privacyAcceptanceStamp", () => {
  it("records when they accepted and which page version they saw", () => {
    const now = new Date("2026-08-29T16:00:00.000Z");
    expect(privacyAcceptanceStamp(now)).toEqual({
      privacy_accepted_at: "2026-08-29T16:00:00.000Z",
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    });
  });

  it("uses a dated version so we can tell which text they accepted", () => {
    expect(PRIVACY_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
