/**
 * Test 4 for spec 4 (page titles).
 *
 * Filesystem coverage — walks src/app/[locale]/dashboard/{parent,student,teacher,assistant}
 * and asserts every rendering page exports generateMetadata.
 *
 * Redirect-only detection: a page is redirect-only if its source contains no
 * `return (` or `return <` statement but does contain a `redirect(` or
 * `permanentRedirect(` call. Pages that redirect conditionally AND render
 * (e.g. payment-gateway callbacks) contain `return (` and are therefore NOT
 * detected as redirects here.
 *
 * Payment-gateway callbacks (flow-return, mp-return) are skipped by a
 * hardcoded path-fragment list because they render real JSX but should not
 * receive a page title (they are never navigated to as a normal destination).
 *
 * No page modules are imported — source files are inspected as text, so no
 * database calls are triggered at test-collection time.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * Payment-gateway callback pages are explicitly out of scope per spec 4.
 * These pages render real JSX (the payment status surface) but are never
 * reached via normal navigation, so they do not receive a page title.
 * They must be listed here because they contain both `redirect(` AND `return (`
 * which means the redirect-only heuristic correctly classifies them as rendering
 * pages — but they are still excluded from the title requirement.
 */
const PAYMENT_CALLBACK_SKIP_FRAGMENTS = [
  "payments/flow-return",
  "payments/mp-return",
];

/**
 * Returns true if the page source has no JSX return and only calls redirect.
 * Such pages are redirect-only and do not need generateMetadata.
 */
function isRedirectOnly(src: string): boolean {
  if (/return\s*\(/.test(src) || /return\s*</.test(src)) return false;
  return /\bredirect\(|\bpermanentRedirect\(/.test(src);
}

function walkPageFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkPageFiles(full));
    } else if (entry === "page.tsx") {
      results.push(full);
    }
  }
  return results;
}

const ROOT = join(process.cwd(), "src/app/[locale]/dashboard");
const PORTALS = ["parent", "student", "teacher", "assistant"];

describe("portal page coverage — every rendering page exports generateMetadata", () => {
  let renderingPages: string[] = [];

  beforeAll(() => {
    const allPages: string[] = [];
    for (const portal of PORTALS) {
      allPages.push(...walkPageFiles(join(ROOT, portal)));
    }

    renderingPages = allPages.filter((filePath) => {
      const normalized = filePath.replace(/\\/g, "/");

      if (PAYMENT_CALLBACK_SKIP_FRAGMENTS.some((frag) => normalized.includes(frag))) {
        return false;
      }

      const src = readFileSync(filePath, "utf-8");
      return !isRedirectOnly(src);
    });
  });

  it("finds at least 25 rendering pages across the four portals (sanity check)", () => {
    expect(renderingPages.length).toBeGreaterThanOrEqual(25);
  });

  it("every rendering page exports generateMetadata", () => {
    const missing = renderingPages.filter((filePath) => {
      const src = readFileSync(filePath, "utf-8");
      return !src.includes("generateMetadata");
    });

    if (missing.length > 0) {
      const rel = missing.map((f) => f.replace(process.cwd() + "/", ""));
      throw new Error(
        `The following rendering pages do not export generateMetadata:\n` +
          rel.map((r) => `  • ${r}`).join("\n"),
      );
    }
  });
});
