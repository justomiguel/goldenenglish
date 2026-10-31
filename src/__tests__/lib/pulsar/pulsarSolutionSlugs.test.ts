import { describe, expect, it } from "vitest";
import { isPulsarSolutionSlug, PULSAR_SOLUTION_SLUGS } from "@/lib/pulsar/pulsarSolutionSlugs";

describe("pulsarSolutionSlugs", () => {
  it("accepts the three commercial solutions and rejects unknown slugs", () => {
    expect(PULSAR_SOLUTION_SLUGS).toEqual(["presencia", "gestion", "ecosistema"]);
    expect(isPulsarSolutionSlug("presencia")).toBe(true);
    expect(isPulsarSolutionSlug("gestion")).toBe(true);
    expect(isPulsarSolutionSlug("ecosistema")).toBe(true);
    expect(isPulsarSolutionSlug("precios")).toBe(false);
  });
});
