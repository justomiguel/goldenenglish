import { describe, expect, it, vi } from "vitest";
import {
  serializeUnknownError,
  logAuthAdminCreateUserFailure,
} from "@/lib/logging/serverActionLog";

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
