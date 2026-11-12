import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("institute-slugs.json", () => {
  it("contains every Vercel target slug", () => {
    const slugs = JSON.parse(readFileSync("scripts/institute-slugs.json", "utf8")) as string[];
    const targets = JSON.parse(readFileSync("scripts/vercel-targets.json", "utf8")) as Record<string, unknown>;
    for (const slug of Object.keys(targets)) {
      expect(slugs).toContain(slug);
    }
  });
});
