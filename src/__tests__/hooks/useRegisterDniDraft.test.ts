/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegisterDniDraft } from "@/hooks/useRegisterDniDraft";
import { registerDniDraftKey, writeRegisterDniDraft } from "@/lib/register/registerDniDraft";

describe("useRegisterDniDraft", () => {
  const key = registerDniDraftKey("es", "reserve");

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("restores a saved document and step on mount", () => {
    writeRegisterDniDraft(key, { dni: "12345678", step: "details" });
    const { result } = renderHook(() => useRegisterDniDraft("es", "reserve"));
    expect(result.current.dni).toBe("12345678");
    expect(result.current.step).toBe("details");
  });

  it("clears the draft and returns to the DNI step", () => {
    writeRegisterDniDraft(key, { dni: "12345678", step: "details" });
    const { result } = renderHook(() => useRegisterDniDraft("es", "reserve"));
    act(() => {
      result.current.clearDraft();
    });
    expect(result.current.dni).toBe("");
    expect(result.current.step).toBe("dni");
    expect(sessionStorage.getItem(key)).toBeNull();
  });
});
