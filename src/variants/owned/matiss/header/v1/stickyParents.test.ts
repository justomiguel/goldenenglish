import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const parents = [
  "src/variants/owned/matiss/home/v1/Web.tsx",
  "src/variants/owned/matiss/blog/v1/Web.tsx",
];

describe("Matiss sticky header parents", () => {
  it.each(parents)("%s does not make a scroll container around the header", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    expect(source).not.toContain("overflow-x-hidden");
    expect(source).toContain("overflow-x-clip");
  });
});
