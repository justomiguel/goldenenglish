import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { Dictionary } from "@/types/i18n";

const dict = es as Dictionary;

describe("marketingLandingCopy", () => {
  it("returns an empty string when the brand block or the leaf is not text", () => {
    const broken = {
      ...dict,
      landing: { ...dict.landing, mz: "nope" },
    } as Dictionary;
    expect(marketingLandingCopy(broken, "mz", "contact.phoneDisplay")).toBe("");
    expect(marketingLandingCopy(dict, "mz", "contact")).toBe("");
  });
});
