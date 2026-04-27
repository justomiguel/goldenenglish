import { describe, expect, it } from "vitest";
import { sanitizeAuditPayload } from "@/lib/audit/sanitizeAuditPayload";

describe("sanitizeAuditPayload", () => {
  it("keeps business values and finance amounts", () => {
    const payload = sanitizeAuditPayload({
      amount_cents: 150000,
      currency: "ARS",
      status: "approved",
    });

    expect(payload).toEqual({
      amount_cents: 150000,
      currency: "ARS",
      status: "approved",
    });
  });

  it("redacts technical secrets recursively", () => {
    const payload = sanitizeAuditPayload({
      password: "plain",
      nested: {
        access_token: "token",
        signed_url: "https://example.test/private",
      },
      rows: [{ authorization: "Bearer secret", amount: 10 }],
    });

    expect(payload).toEqual({
      password: "[REDACTED]",
      nested: {
        access_token: "[REDACTED]",
        signed_url: "[REDACTED]",
      },
      rows: [{ authorization: "[REDACTED]", amount: 10 }],
    });
  });
});
