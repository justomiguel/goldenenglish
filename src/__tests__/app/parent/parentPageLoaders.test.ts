// Test group 4 — no new queries
// Spec 7, Test 4: The parent page's loader set is unchanged.
// Asserts against the exact list of loaders called in page.tsx so a future
// "just one more fetch" on the home screen is caught automatically.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PAGE_PATH = join(
  process.cwd(),
  "src/app/[locale]/dashboard/parent/page.tsx",
);

const EXPECTED_LOADERS = new Set([
  "loadParentChildrenSummaries",
  "loadParentFamilyHubModel",
  "loadParentHomeMessageSignals",
  "loadParentHomePaymentOverdueSignals",
  "loadPortalCalendarPageData",
  "loadParentHomeNewsFeed",
]);

describe("parent page — no new queries (Test 4)", () => {
  it("imports exactly the known set of loader functions, no more", () => {
    const src = readFileSync(PAGE_PATH, "utf-8");
    // Collect all imported load* names from import declarations.
    const importedLoaders = new Set<string>();
    for (const match of src.matchAll(/import\s*\{[^}]*\}\s*from\s*["'][^"']+["']/g)) {
      const block = match[0];
      // Find names starting with "load" inside the braces
      for (const nameMatch of block.matchAll(/\b(load\w+)\b/g)) {
        importedLoaders.add(nameMatch[1]);
      }
    }
    const extra = [...importedLoaders].filter((n) => !EXPECTED_LOADERS.has(n));
    expect(extra, `Unexpected loaders imported: ${extra.join(", ")}`).toHaveLength(0);
  });

  it("still imports all expected loaders", () => {
    const src = readFileSync(PAGE_PATH, "utf-8");
    for (const loader of EXPECTED_LOADERS) {
      expect(src, `Expected ${loader} to be imported`).toContain(loader);
    }
  });
});
