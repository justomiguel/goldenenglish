/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { registrationIntentLabel } from "@/lib/register/registrationIntentLabel";

const labels = { intentReserve: "Pre-enrollment", intentTrial: "Trial class" };

describe("registrationIntentLabel", () => {
  it("labels a trial lead as a trial class", () => {
    expect(registrationIntentLabel(labels, "trial")).toBe("Trial class");
  });

  it("labels reserve and missing intent as a pre-enrollment", () => {
    expect(registrationIntentLabel(labels, "reserve")).toBe("Pre-enrollment");
    expect(registrationIntentLabel(labels)).toBe("Pre-enrollment");
  });
});
