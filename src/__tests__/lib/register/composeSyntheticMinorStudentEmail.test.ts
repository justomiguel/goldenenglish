import { describe, it, expect } from "vitest";
import {
  composeSyntheticMinorStudentEmail,
  sanitizePersonNameForEmailLocalSegment,
} from "@/lib/register/composeSyntheticMinorStudentEmail";

describe("composeSyntheticMinorStudentEmail", () => {
  it("combines sanitized name segments and document fingerprint", () => {
    expect(
      composeSyntheticMinorStudentEmail("Juan", "Pérez", "12-345-K", "alumnos.test"),
    ).toBe("juanperez-12345k@alumnos.test");
  });

  it("truncates overly long document fingerprint", () => {
    const longDoc = `${"x".repeat(40)}`;
    expect(
      composeSyntheticMinorStudentEmail("A", "B", longDoc, "alumnos.test"),
    ).toBe(`ab-${"x".repeat(20)}@alumnos.test`);
  });

  it("fallbacks local part when letters are trimmed away", () => {
    expect(
      composeSyntheticMinorStudentEmail("", "", "XYZ", "alumnos.test"),
    ).toBe("alumno-xyz@alumnos.test");
    expect(sanitizePersonNameForEmailLocalSegment("@")).toBe("");
  });

  it("appends optional letter-only suffix after name core", () => {
    expect(
      composeSyntheticMinorStudentEmail("Juan", "Pérez", "12-345-K", "alumnos.test", {
        coreSuffix: "xz93*", // non-letters stripped
      }),
    ).toBe("juanperezxz-12345k@alumnos.test");
  });

  it("shortens local-part when core plus document fingerprint exceeds 64 chars", () => {
    const longName = "c".repeat(60);
    const longDoc = "9".repeat(24);
    const email = composeSyntheticMinorStudentEmail(
      longName,
      longName,
      longDoc,
      "institute.edu",
      { coreSuffix: "ab" },
    );
    const [local, domain] = email.split("@");
    expect(domain).toBe("institute.edu");
    expect(local.length).toBeLessThanOrEqual(64);
    expect(local).toMatch(/^[^@]+-[a-z0-9]+$/);
  });
});
