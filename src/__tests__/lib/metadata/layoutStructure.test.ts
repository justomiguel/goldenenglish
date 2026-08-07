/**
 * Tests 2 and 3 for spec 4 (page titles).
 *
 * Test 2: [locale]/layout.tsx has a title template but NO default.
 *         This pins the structural bug: the test fails against today's code
 *         (which has `default: brand.name`) and would fail again if reinstated.
 * Test 3: Root layout still has both default and template (fallback lives here).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Test 2: locale layout — template only, no default ───────────────────────

describe("[locale]/layout.tsx title metadata structure", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/[locale]/layout.tsx"),
    "utf-8",
  );

  it("still has a title template", () => {
    expect(src).toMatch(/template:/);
  });

  it("does NOT have a title default — the structural-duplication fix", () => {
    // Before the fix: title: { default: brand.name, template: `%s | ${brand.name}` }
    // After the fix:  title: { template: `%s | ${brand.name}` }
    //
    // Find the title: { ... } block and confirm 'default:' is absent.
    const titleBlockMatch = src.match(/title:\s*\{([^}]+)\}/);
    expect(titleBlockMatch).not.toBeNull();
    const titleBlock = titleBlockMatch![1];
    expect(titleBlock).not.toMatch(/\bdefault:/);
  });
});

// ─── Test 3: root layout — still has both default and template ───────────────

describe("src/app/layout.tsx (root) title metadata structure", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/layout.tsx"),
    "utf-8",
  );

  it("still has a title default — the global fallback", () => {
    const titleBlockMatch = src.match(/title:\s*\{([^}]+)\}/);
    expect(titleBlockMatch).not.toBeNull();
    const titleBlock = titleBlockMatch![1];
    expect(titleBlock).toMatch(/\bdefault:/);
  });

  it("still has a title template", () => {
    const titleBlockMatch = src.match(/title:\s*\{([^}]+)\}/);
    expect(titleBlockMatch).not.toBeNull();
    const titleBlock = titleBlockMatch![1];
    expect(titleBlock).toMatch(/\btemplate:/);
  });
});
