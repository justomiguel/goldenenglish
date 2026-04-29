/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { parseAuthRedirectParams } from "@/lib/auth/parseAuthRedirectParams";

describe("parseAuthRedirectParams", () => {
  it("reads code from hash", () => {
    const href = "http://localhost/es/reset-password#code=fromhash&type=recovery";
    const r = parseAuthRedirectParams(href);
    expect(r.code).toBe("fromhash");
    expect(r.type).toBe("recovery");
  });

  it("gives query precedence over hash for the same key", () => {
    const href = "http://localhost/es/reset-password?code=q#code=h";
    const r = parseAuthRedirectParams(href);
    expect(r.code).toBe("q");
  });
});
