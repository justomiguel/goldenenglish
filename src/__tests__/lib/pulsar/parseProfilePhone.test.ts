import { describe, expect, it } from "vitest";
import { parseProfilePhone } from "@/lib/pulsar/platformUserProfile";

describe("parseProfilePhone", () => {
  it("keeps a blank phone and a valid number", () => {
    expect(parseProfilePhone("  ")).toEqual({ ok: true, phone: "" });
    expect(parseProfilePhone("+56 9 1111 2222")).toEqual({ ok: true, phone: "+56 9 1111 2222" });
  });

  it("rejects a value that is not a phone", () => {
    expect(parseProfilePhone("hola")).toEqual({ ok: false });
  });
});
