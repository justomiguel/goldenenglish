import { describe, it, expect } from "vitest";
import type { Dictionary } from "@/types/i18n";
import { appendAuthIncidentReferenceLine } from "@/lib/dashboard/appendAuthIncidentReferenceLine";
import { dictEn } from "@/test/dictEn";

describe("appendAuthIncidentReferenceLine", () => {
  const d = dictEn as Dictionary;

  it("returns the base paragraph when ref is omitted", () => {
    expect(appendAuthIncidentReferenceLine(d, "base-message", undefined)).toBe("base-message");
    expect(appendAuthIncidentReferenceLine(d, "base-message")).toBe("base-message");
  });

  it("appends the templated correlation line including the uuid", () => {
    const out = appendAuthIncidentReferenceLine(d, "base-message", "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    expect(out.startsWith("base-message")).toBe(true);
    expect(out.includes("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee")).toBe(true);
  });
});
