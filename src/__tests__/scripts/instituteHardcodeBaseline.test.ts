import { describe, expect, it } from "vitest";
import {
  compareWithBaseline,
  lowerBaseline,
  raisedAgainstCommitted,
} from "../../../scripts/lib/instituteHardcodeBaseline.mjs";

const hit = (path, code, slug, line = 1) => ({ path, code, slug, line });

describe("institute hardcode baseline", () => {
  it("marks a new path as grown", () => {
    const result = compareWithBaseline(
      [hit("src/lib/a.ts", "slug_comparison", "nago")],
      [],
    );
    expect(result.grown).toEqual([{ path: "src/lib/a.ts", code: "slug_comparison", slug: "nago", count: 1 }]);
    expect(result.shrunk).toEqual([]);
  });

  it("marks a higher count as grown and a lower count as shrunk", () => {
    const baseline = [{ path: "src/lib/a.ts", code: "slug_comparison", slug: "nago", count: 1 }];
    const grown = compareWithBaseline(
      [hit("src/lib/a.ts", "slug_comparison", "nago", 1), hit("src/lib/a.ts", "slug_comparison", "nago", 2)],
      baseline,
    );
    expect(grown.grown[0]?.count).toBe(2);
    const shrunk = compareWithBaseline([], baseline);
    expect(shrunk.shrunk).toEqual(baseline);
  });

  it("lowers counts and drops zeros without raising a count", () => {
    const baseline = [
      { path: "src/lib/b.ts", code: "slug_css", slug: "liora", count: 2 },
      { path: "src/lib/a.ts", code: "slug_table", slug: "nago", count: 1 },
    ];
    const next = lowerBaseline(
      [hit("src/lib/b.ts", "slug_css", "liora")],
      baseline,
    );
    expect(next).toEqual([{ path: "src/lib/b.ts", code: "slug_css", slug: "liora", count: 1 }]);
    const raised = lowerBaseline(
      [hit("src/lib/a.ts", "slug_table", "nago", 1), hit("src/lib/a.ts", "slug_table", "nago", 2)],
      [{ path: "src/lib/a.ts", code: "slug_table", slug: "nago", count: 1 }],
    );
    expect(raised).toEqual([{ path: "src/lib/a.ts", code: "slug_table", slug: "nago", count: 1 }]);
  });

  it("flags a committed baseline that gained a count", () => {
    const committed = [{ path: "src/lib/a.ts", code: "slug_table", slug: "nago", count: 1 }];
    const working = [
      { path: "src/lib/a.ts", code: "slug_table", slug: "nago", count: 2 },
      { path: "src/lib/b.ts", code: "slug_css", slug: "liora", count: 1 },
    ];
    expect(raisedAgainstCommitted(working, committed).map((entry) => entry.path)).toEqual([
      "src/lib/a.ts",
      "src/lib/b.ts",
    ]);
    expect(raisedAgainstCommitted(committed, committed)).toEqual([]);
  });
});
