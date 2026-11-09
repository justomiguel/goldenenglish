import { afterEach, describe, expect, it, vi } from "vitest";

import {
  serializeUnknownError,
  logAuthAdminCreateUserFailure,
  logServerWarn,
  logServerInfo,
  logServerError,
  registerRequestHeaderReader,
} from "@/lib/logging/serverActionLog";
import { registerAlsTenantReader } from "@/lib/tenant/alsTenantAccessor";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const headerGet = vi.fn<(name: string) => string | null>(() => null);

afterEach(() => {
  registerRequestHeaderReader(() => null);
  registerAlsTenantReader(() => null);
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
  it("logs structured auth diagnostics with ge:server prefix", async () => {
    registerRequestHeaderReader(() => ({
      get: (name) => {
        if (name === "host") return "nago.cl";
        if (name === "x-ge-tenant") return "nago";
        return null;
      },
    }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await logAuthAdminCreateUserFailure("unitTest:createUser", { message: "m", code: "x", status: "422" }, {
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
  it("adds the request host to error, warning, and info lines", async () => {
    registerRequestHeaderReader(() => ({ get: (name) => headerGet(name) }));
    headerGet.mockImplementation((name) => {
      if (name === "x-forwarded-host") return "LioraStudio.cl:443";
      if (name === "x-ge-tenant") return "liora";
      return null;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await logServerError("unit.host", { reason: "empty" });
    await logServerWarn("unit.host", { reason: "slow" });
    await logServerInfo("unit.host", { count: 1 });

    for (const spy of [errorSpy, warnSpy, infoSpy]) {
      const payload = spy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
      expect(payload.host).toBe("liorastudio.cl");
      expect(payload.tenantSlug).toBe("liora");
    }
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it("awaits a header reader that returns a Promise", async () => {
    registerRequestHeaderReader(async () => ({
      get: (name) => {
        if (name === "host") return "mozarthitos.cl";
        if (name === "x-ge-tenant") return "mozarthitos";
        return null;
      },
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await logServerError("unit.async-host", { reason: "view" });

    const payload = errorSpy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
    expect(payload.host).toBe("mozarthitos.cl");
    expect(payload.tenantSlug).toBe("mozarthitos");
    errorSpy.mockRestore();
  });

  it("uses the active institute when the request has no tenant header", async () => {
    registerRequestHeaderReader(() => null);
    registerAlsTenantReader(
      () => ({ slug: "mozarthitos", hosts: ["www.mozarthitos.cl"] }) as TenantConfig,
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await logServerError("unit.cron", { reason: "job" });

    const payload = errorSpy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
    expect(payload.host).toBe("www.mozarthitos.cl");
    expect(payload.tenantSlug).toBe("mozarthitos");
    errorSpy.mockRestore();
  });

  it("keeps the request host when meta sends null", async () => {
    registerRequestHeaderReader(() => ({
      get: (name) => {
        if (name === "x-forwarded-host") return "www.mozarthitos.cl";
        if (name === "x-ge-tenant") return "mozarthitos";
        return null;
      },
    }));
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await logServerInfo("sendRegistrationAdminEmails:list", {
      host: null,
      tenantSlug: null,
      templateKey: "events.admin_registered",
    });

    const payload = infoSpy.mock.calls[0]?.[2] as {
      host: string;
      tenantSlug: string;
      templateKey: string;
    };
    expect(payload.host).toBe("www.mozarthitos.cl");
    expect(payload.tenantSlug).toBe("mozarthitos");
    expect(payload.templateKey).toBe("events.admin_registered");
    infoSpy.mockRestore();
  });
});
