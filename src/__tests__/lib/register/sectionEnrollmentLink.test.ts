import { describe, expect, it } from "vitest";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";

describe("isSectionEnrollmentLinkToken", () => {
  it("accepts a canonical uuid in either case", () => {
    expect(isSectionEnrollmentLinkToken("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true);
    expect(isSectionEnrollmentLinkToken("3F2504E0-4F89-11D3-9A0C-0305E82C3301")).toBe(true);
  });

  it("rejects anything that is not a uuid", () => {
    expect(isSectionEnrollmentLinkToken("")).toBe(false);
    expect(isSectionEnrollmentLinkToken("abc")).toBe(false);
    expect(isSectionEnrollmentLinkToken("3f2504e0-4f89-11d3-9a0c-0305e82c33")).toBe(false);
    expect(isSectionEnrollmentLinkToken("../../etc/passwd")).toBe(false);
    expect(isSectionEnrollmentLinkToken(null)).toBe(false);
    expect(isSectionEnrollmentLinkToken(42)).toBe(false);
  });
});
