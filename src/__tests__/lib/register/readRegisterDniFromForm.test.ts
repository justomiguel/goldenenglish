/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { readRegisterDniFromForm } from "@/lib/register/readRegisterDniFromForm";

function formWithDni(value: string): HTMLFormElement {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "dni";
  input.value = value;
  form.appendChild(input);
  return form;
}

describe("readRegisterDniFromForm", () => {
  it("prefers the live form value over React state", () => {
    expect(readRegisterDniFromForm(formWithDni("  87654321  "), "")).toBe("87654321");
  });

  it("falls back to trimmed state when the form field is empty", () => {
    expect(readRegisterDniFromForm(formWithDni("   "), "  12345678  ")).toBe("12345678");
  });

  it("falls back to state when there is no form", () => {
    expect(readRegisterDniFromForm(null, "  12345678  ")).toBe("12345678");
  });
});
