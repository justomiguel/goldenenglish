import { describe, expect, it } from "vitest";
import { pickI18n } from "@/lib/questionnaires/pickI18n";

describe("pickI18n", () => {
  it("prefers the requested locale when non-empty", () => {
    expect(pickI18n({ es: "Hola", en: "Hi" }, "en")).toBe("Hi");
  });

  it("falls back to defaultLocale then first non-empty", () => {
    expect(pickI18n({ es: "Hola", en: "" }, "pt")).toBe("Hola");
    expect(pickI18n({ pt: "Oi" }, "en")).toBe("Oi");
    expect(pickI18n({}, "es")).toBe("");
  });
});
