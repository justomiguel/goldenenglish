import { describe, it, expect } from "vitest";
import { pickLocaleFromUnknownPayload } from "@/lib/parent/pickLocaleFromUnknownPayload";

describe("pickLocaleFromUnknownPayload", () => {
  it("returns en or es when present on payload", () => {
    expect(pickLocaleFromUnknownPayload({ locale: "en" })).toBe("en");
    expect(pickLocaleFromUnknownPayload({ locale: "ES" })).toBe("es");
  });

  it("defaults to es when missing or invalid", () => {
    expect(pickLocaleFromUnknownPayload({})).toBe("es");
    expect(pickLocaleFromUnknownPayload(null)).toBe("es");
    expect(pickLocaleFromUnknownPayload({ locale: "fr" })).toBe("es");
  });
});
