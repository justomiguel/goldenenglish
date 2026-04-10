/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  getRememberMePreference,
  setRememberMePreference,
} from "@/lib/supabase/client";

describe("Supabase client (node / no window)", () => {
  it("getRememberMePreference defaults to true without window", () => {
    expect(getRememberMePreference()).toBe(true);
  });

  it("setRememberMePreference no-ops without window", () => {
    expect(() => setRememberMePreference(false)).not.toThrow();
  });
});
