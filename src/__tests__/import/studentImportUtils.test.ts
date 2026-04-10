import { describe, it, expect } from "vitest";
import {
  defaultEmail,
  normalizeDni,
} from "@/lib/import/studentImportUtils";

describe("normalizeDni", () => {
  it("strips dots and spaces", () => {
    expect(normalizeDni(" 12.345.678 ")).toEqual({
      dni: "12345678",
      password: "12345678",
    });
  });

  it("pads short dni to 6 for password", () => {
    expect(normalizeDni("123")).toEqual({ dni: "123", password: "123000" });
  });
});

describe("defaultEmail", () => {
  it("builds local student email from alphanumeric dni", () => {
    expect(defaultEmail("12-345")).toBe("12345@students.goldenenglish.local");
  });

  it("uses sin-doc when dni has no alphanumerics", () => {
    expect(defaultEmail("---")).toBe("sin-doc@students.goldenenglish.local");
  });
});
