import { describe, it, expect } from "vitest";
import { normalizeBirthDateString } from "@/lib/import/birthDateNormalize";

describe("normalizeBirthDateString", () => {
  it("passes through ISO dates", () => {
    expect(normalizeBirthDateString("2013-10-10")).toBe("2013-10-10");
  });

  it("parses DD/MM/YY as Spanish", () => {
    expect(normalizeBirthDateString("10/10/13")).toBe("2013-10-10");
  });

  it("parses M/D/YY when day > 12", () => {
    expect(normalizeBirthDateString("6/14/14")).toBe("2014-06-14");
  });

  it("returns undefined when the calendar date is invalid (DD/MM)", () => {
    expect(normalizeBirthDateString("30/02/2020")).toBeUndefined();
  });

  it("returns undefined when neither DD/MM nor MM/DD can be resolved", () => {
    expect(normalizeBirthDateString("32/01/2020")).toBeUndefined();
  });

  it("returns undefined for whitespace-only input", () => {
    expect(normalizeBirthDateString("   \n")).toBeUndefined();
  });

  it("returns undefined when there are not exactly three parts", () => {
    expect(normalizeBirthDateString("1/2")).toBeUndefined();
  });

  it("returns undefined when parts are not numeric", () => {
    expect(normalizeBirthDateString("a/b/c")).toBeUndefined();
  });
});
