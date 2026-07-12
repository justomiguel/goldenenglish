// REGRESSION CHECK: Isolation + fail-closed require helpers for precommit E2E.
import { describe, expect, it } from "vitest";
import {
  defaultE2eBaseURL,
  e2eRequireEnabled,
  e2eRequireFailureMessage,
  e2eSkipRequested,
  resolveE2eIsolation,
} from "../../../e2e/env";
import { parseDotenvContents } from "../../../e2e/parseDotenvContents";

describe("resolveE2eIsolation", () => {
  it("rejects missing E2E_STACK", () => {
    const r = resolveE2eIsolation({
      E2E_ADMIN_EMAIL: "a@b.c",
      E2E_ADMIN_PASSWORD: "x",
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3100",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/E2E_STACK/);
  });

  it("rejects product GE_DEV_TARGET", () => {
    const r = resolveE2eIsolation({
      E2E_STACK: "isolated",
      GE_DEV_TARGET: "nago",
      E2E_ADMIN_EMAIL: "a@b.c",
      E2E_ADMIN_PASSWORD: "x",
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3100",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/nago/);
  });

  it("rejects non-local BASE_URL", () => {
    const r = resolveE2eIsolation({
      E2E_STACK: "isolated",
      E2E_ADMIN_EMAIL: "a@b.c",
      E2E_ADMIN_PASSWORD: "x",
      PLAYWRIGHT_BASE_URL: "https://nago.example.com",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not local/);
  });

  it("accepts isolated local stack with seeded admin env", () => {
    const r = resolveE2eIsolation({
      E2E_STACK: "isolated",
      GE_DEV_TARGET: "e2e",
      E2E_ADMIN_EMAIL: "e2e-admin@example.test",
      E2E_ADMIN_PASSWORD: "secret",
      PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3100",
      E2E_LOCALE: "es",
    });
    expect(r).toEqual({
      ok: true,
      baseURL: "http://127.0.0.1:3100",
      locale: "es",
    });
  });

  it("defaults BASE_URL to port 3100 when unset", () => {
    const r = resolveE2eIsolation({
      E2E_STACK: "isolated",
      E2E_ADMIN_EMAIL: "a@b.c",
      E2E_ADMIN_PASSWORD: "x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.baseURL).toBe(defaultE2eBaseURL({}));
  });
});

describe("e2eRequireFailureMessage", () => {
  it("is null when require is off even if isolation fails", () => {
    expect(
      e2eRequireFailureMessage({
        E2E_REQUIRE: "0",
      }),
    ).toBeNull();
  });

  it("returns a message when require is on and isolation fails", () => {
    const msg = e2eRequireFailureMessage({
      E2E_REQUIRE: "1",
    });
    expect(msg).toMatch(/E2E_REQUIRE=1/);
    expect(msg).toMatch(/E2E_STACK/);
  });

  it("is null when require is on and isolation is ok", () => {
    expect(
      e2eRequireFailureMessage({
        E2E_REQUIRE: "1",
        E2E_STACK: "isolated",
        GE_DEV_TARGET: "e2e",
        E2E_ADMIN_EMAIL: "a@b.c",
        E2E_ADMIN_PASSWORD: "x",
        PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3100",
      }),
    ).toBeNull();
  });
});

describe("flags", () => {
  it("detects SKIP_E2E and E2E_REQUIRE", () => {
    expect(e2eSkipRequested({ SKIP_E2E: "1" })).toBe(true);
    expect(e2eSkipRequested({})).toBe(false);
    expect(e2eRequireEnabled({ E2E_REQUIRE: "1" })).toBe(true);
    expect(e2eRequireEnabled({})).toBe(false);
  });
});

describe("parseDotenvContents", () => {
  it("parses keys, quotes, and skips comments", () => {
    expect(
      parseDotenvContents(`
# comment
E2E_STACK=isolated
E2E_ADMIN_EMAIL="a@b.c"
EMPTY=
NOT A KEY
`),
    ).toEqual({
      E2E_STACK: "isolated",
      E2E_ADMIN_EMAIL: "a@b.c",
      EMPTY: "",
    });
  });
});
