import { describe, expect, it } from "vitest";
import { resolveMiMundoRegisterDict } from "@/lib/register/resolveMiMundoRegisterDict";
import { dictEn } from "@/test/dictEn";

describe("resolveMiMundoRegisterDict", () => {
  it("replaces document copy with Mi Mundo keys (no RUT)", () => {
    const out = resolveMiMundoRegisterDict(
      dictEn.register,
      dictEn.landing.mm.register,
    );

    expect(out.dni).toBe(dictEn.landing.mm.register.dni);
    expect(out.dni).not.toMatch(/RUT/i);
    expect(out.documentIdFormatHint).toBe(
      dictEn.landing.mm.register.documentIdFormatHint,
    );
    expect(out.documentIdFormatHint).not.toMatch(/RUT/i);
    expect(out.tutorDni).toBe(dictEn.landing.mm.register.tutorDni);
    expect(out.tutorDni).not.toMatch(/RUT/i);
    expect(out.firstName).toBe(dictEn.register.firstName);
  });
});
