/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearRegisterDniDraft,
  readRegisterDniDraft,
  registerDniDraftKey,
  writeRegisterDniDraft,
} from "@/lib/register/registerDniDraft";

describe("registerDniDraft", () => {
  const key = registerDniDraftKey("es", "reserve");

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("writes and reads a draft keyed by locale and intent", () => {
    writeRegisterDniDraft(key, { dni: "12345678", step: "details" });
    expect(readRegisterDniDraft(key)).toEqual({ dni: "12345678", step: "details" });
    expect(readRegisterDniDraft(registerDniDraftKey("en", "reserve"))).toBeNull();
  });

  it("clears the draft and ignores broken json", () => {
    writeRegisterDniDraft(key, { dni: "12345678", step: "details" });
    clearRegisterDniDraft(key);
    expect(readRegisterDniDraft(key)).toBeNull();
    sessionStorage.setItem(key, "{not-json");
    expect(readRegisterDniDraft(key)).toBeNull();
  });
});
