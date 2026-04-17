import { describe, expect, it } from "vitest";
import { serializeUnknownError } from "@/lib/logging/serverActionLog";

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
