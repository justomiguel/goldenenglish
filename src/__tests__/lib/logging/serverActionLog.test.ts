import { afterEach, describe, expect, it, vi } from "vitest";

import {
  serializeUnknownError,
  logAuthAdminCreateUserFailure,
  logServerWarn,
  logServerInfo,
  logServerError,
  registerRequestHeaderReader,
} from "@/lib/logging/serverActionLog";

const headerGet = vi.fn<(name: string) => string | null>(() => null);

afterEach(() => {
  registerRequestHeaderReader(() => null);
  headerGet.mockReset();
});

describe("serializeUnknownError", () => {
  it("serializes Error with name and message", () => {
    const e = new Error("boom");
    e.name = "CustomError";
    const s = serializeUnknownError(e);
    expect(s.name).toBe("CustomError");
    expect(s.message).toBe("boom");
  });

  it("serializes non-Error values", () => {
    expect(serializeUnknownError("x").message).toBe("x");
    expect(serializeUnknownError(42).message).toBe("42");
  });
});

describe("logAuthAdminCreateUserFailure", () => {
  it("logs structured auth diagnostics with ge:server prefix", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logAuthAdminCreateUserFailure("unitTest:createUser", { message: "m", code: "x", status: "422" }, {
      classified_issue: "unexpected",
      incidentRef: "ir-1",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0] as unknown[];
    const [, scope, payload] = call;
    expect(scope).toBe("unitTest:createUser");
    expect(payload).toMatchObject({
      kind: "auth_admin_create_user_failure",
      classified_issue: "unexpected",
      incidentRef: "ir-1",
      auth_error: { message: "m", code: "x", status: 422 },
    });
    spy.mockRestore();
  });
});

describe("request host on server logs", () => {
  it("adds the request host to error, warning, and info lines", () => {
    registerRequestHeaderReader(() => ({ get: (name) => headerGet(name) }));
    headerGet.mockImplementation((name) => {
      if (name === "x-forwarded-host") return "LioraStudio.cl:443";
      if (name === "x-ge-tenant") return "liora";
      return null;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logServerError("unit.host", { reason: "empty" });
    logServerWarn("unit.host", { reason: "slow" });
    logServerInfo("unit.host", { count: 1 });

    for (const spy of [errorSpy, warnSpy, infoSpy]) {
      const payload = spy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
      expect(payload.host).toBe("liorastudio.cl");
      expect(payload.tenantSlug).toBe("liora");
    }
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });
});
