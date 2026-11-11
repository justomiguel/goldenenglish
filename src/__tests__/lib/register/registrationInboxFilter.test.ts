/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  applyRegistrationFunnelFilter,
  parseRegistrationInboxFilter,
} from "@/lib/register/registrationInboxFilter";

function capture() {
  const calls: string[] = [];
  const query = {
    eq(column: string, value: string) {
      calls.push(`eq ${column} ${value}`);
      return query;
    },
    neq(column: string, value: string) {
      calls.push(`neq ${column} ${value}`);
      return query;
    },
    or(filters: string) {
      calls.push(`or ${filters}`);
      return query;
    },
  };
  return { query, calls };
}

describe("parseRegistrationInboxFilter", () => {
  it("defaults to the first funnel stage", () => {
    expect(parseRegistrationInboxFilter(undefined)).toBe("registered");
    expect(parseRegistrationInboxFilter("nope")).toBe("registered");
    expect(parseRegistrationInboxFilter("urgent")).toBe("registered");
  });

  it("keeps contacted from the legacy status query", () => {
    expect(parseRegistrationInboxFilter(undefined, "contacted")).toBe("contacted");
  });
});

describe("applyRegistrationFunnelFilter", () => {
  it("keeps a new lead in Inscriptos until the matrícula mail is sent", () => {
    const { query, calls } = capture();
    applyRegistrationFunnelFilter(query, "registered", []);
    expect(calls.join("\n")).toContain("eq status new");
    expect(calls.join("\n")).toContain("enrollment_fee_mail_sent_at.is.null");
    expect(calls.join("\n")).not.toContain("offer_pending");
  });

  it("puts a contacted fee lead in Inscriptos contactados before the mail", () => {
    const { query, calls } = capture();
    applyRegistrationFunnelFilter(query, "contacted", ["sec-1"]);
    expect(calls.join("\n")).toContain("eq status contacted");
    expect(calls.join("\n")).toContain("preferred_section_id.in.(sec-1)");
  });

  it("keeps a zero-fee lead out of the payment stage", () => {
    const { query, calls } = capture();
    applyRegistrationFunnelFilter(query, "awaiting_section", []);
    const text = calls.join("\n");
    expect(text).toContain("status.eq.contacted");
    expect(text).not.toContain("fee_snapshot->>total.gt.0");
  });
});
