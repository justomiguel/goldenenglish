// REGRESSION CHECK: Unknown interest must not preselect a product.
import { describe, expect, it } from "vitest";
import { readCentrolistoInterest } from "@/lib/pulsar/centrolistoInterest";

describe("readCentrolistoInterest", () => {
  it("maps a product CTA and a generic demo", () => {
    expect(readCentrolistoInterest("gestion")).toBe("gestion");
    expect(readCentrolistoInterest(["demo"])).toBe("unsure");
    expect(readCentrolistoInterest("taller")).toBeNull();
  });
});
