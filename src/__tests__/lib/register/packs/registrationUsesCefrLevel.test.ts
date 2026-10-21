import { describe, expect, it } from "vitest";
import { registrationUsesCefrLevel } from "@/lib/register/packs/registrationUsesCefrLevel";

describe("registrationUsesCefrLevel", () => {
  it("keeps CEFR level on the English-school templates", () => {
    expect(registrationUsesCefrLevel("classic")).toBe(true);
    expect(registrationUsesCefrLevel("editorial")).toBe(true);
    expect(registrationUsesCefrLevel("minimal")).toBe(true);
  });

  it("omits CEFR level on named institutes", () => {
    expect(registrationUsesCefrLevel("nago")).toBe(false);
    expect(registrationUsesCefrLevel("mozarthitos")).toBe(false);
    expect(registrationUsesCefrLevel("espaciozenit")).toBe(false);
    expect(registrationUsesCefrLevel("mimundo")).toBe(false);
    expect(registrationUsesCefrLevel("liora")).toBe(false);
  });
});
