import { describe, expect, it } from "vitest";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";

describe("normalizeRegistrationDocument", () => {
  it("matches normalizeDni().dni for dots, spaces, and trim", () => {
    const raw = "  12.345.678-K  ";
    expect(normalizeRegistrationDocument(raw)).toBe(normalizeDni(raw).dni);
    expect(normalizeRegistrationDocument(raw)).toBe("12345678-K");
  });

  it("does not lowercase (comparison does that later)", () => {
    expect(normalizeRegistrationDocument("AB.12 34")).toBe("AB1234");
  });
});
