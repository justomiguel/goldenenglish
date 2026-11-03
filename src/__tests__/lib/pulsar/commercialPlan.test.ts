import { describe, expect, it } from "vitest";
import { parseCommercialPlan } from "@/lib/pulsar/commercialPlan";

describe("parseCommercialPlan", () => {
  it("parses ecosistema", () => {
    expect(parseCommercialPlan("ecosistema")).toBe("ecosistema");
  });

  it("falls back to gestion for unknown values", () => {
    expect(parseCommercialPlan("free")).toBe("gestion");
    expect(parseCommercialPlan(null)).toBe("gestion");
  });
});
