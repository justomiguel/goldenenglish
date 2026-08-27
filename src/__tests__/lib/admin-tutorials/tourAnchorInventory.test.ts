// REGRESSION CHECK: Declared ADMIN_TOUR_ANCHORS must exist as literals in UI source;
// orphan data-tour / tourAnchor / tourId literals must not invent a second namespace (rule 33).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import {
  findMissingDeclaredAnchors,
  findOrphanTourAnchors,
} from "@/lib/admin-tutorials/tourAnchorInventory";

const ROOT = join(process.cwd(), "src");
const SCAN_ROOTS = [join(ROOT, "components"), join(ROOT, "app")];

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectSourceFiles(full, out);
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(full);
  }
  return out;
}

function readUiHaystack(): string {
  const files = SCAN_ROOTS.flatMap((r) => collectSourceFiles(r));
  return files.map((f) => readFileSync(f, "utf8")).join("\n");
}

describe("tourAnchorInventory", () => {
  // Full src/components + src/app scan; 15s flakes under coverage/precommit load.
  it(
    "every ADMIN_TOUR_ANCHORS value appears in UI (literal or ADMIN_TOUR_ANCHORS.key)",
    () => {
      const haystack = readUiHaystack();
      const declared = Object.values(ADMIN_TOUR_ANCHORS);
      const keyByValue = new Map(
        (Object.entries(ADMIN_TOUR_ANCHORS) as [string, string][]).map(([k, v]) => [v, k]),
      );
      const missing = findMissingDeclaredAnchors(declared, haystack, keyByValue);
      expect(missing, `Missing UI literals for: ${missing.join(", ")}`).toEqual([]);
    },
    60_000,
  );

  it(
    "rejects orphan data-tour / tourAnchor / tourId literals not in ADMIN_TOUR_ANCHORS",
    () => {
      const haystack = readUiHaystack();
      const declared = new Set(Object.values(ADMIN_TOUR_ANCHORS));
      const orphans = findOrphanTourAnchors(declared, haystack);
      expect(orphans, `Orphan tour anchors: ${orphans.join(", ")}`).toEqual([]);
    },
    60_000,
  );
});
