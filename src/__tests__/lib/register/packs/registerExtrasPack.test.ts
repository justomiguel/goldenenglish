import { describe, expect, it } from "vitest";
import { parseRegisterExtrasPack } from "@/lib/register/packs/registerExtrasPack";

describe("parseRegisterExtrasPack", () => {
  it("parses the known pack ids", () => {
    expect(parseRegisterExtrasPack("martial_arts_uniform")).toBe("martial_arts_uniform");
    expect(parseRegisterExtrasPack("family_guide")).toBe("family_guide");
  });

  it("rejects a tenant kind, an empty value, and an unknown id", () => {
    expect(parseRegisterExtrasPack("nago")).toBeNull();
    expect(parseRegisterExtrasPack("mozarthitos")).toBeNull();
    expect(parseRegisterExtrasPack("")).toBeNull();
    expect(parseRegisterExtrasPack(null)).toBeNull();
    expect(parseRegisterExtrasPack(undefined)).toBeNull();
    expect(parseRegisterExtrasPack("classic")).toBeNull();
  });
});
