/**
 * Test group 3 from spec 8:
 * No ad-hoc destructive styling remains in the migrated call sites.
 *
 * This test greps the seven named components (plus ConfirmActionModal, which
 * used the same !important pattern) for --color-error combined with text- or
 * bg- in className props, and fails if any survives outside Button.tsx.
 *
 * It is the guard that stops the ad-hoc pattern reappearing.
 */
import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SRC = path.resolve(__dirname, "../../");

function readComponent(...segments: string[]): string {
  return fs.readFileSync(path.join(SRC, ...segments), "utf-8");
}

/**
 * Returns true if the source contains `--color-error` adjacent to a `text-`
 * or `bg-` Tailwind utility in a button or interactive element's className
 * (the ad-hoc danger-styling pattern).
 *
 * Explicitly EXCLUDES error colour on `<p>`, `<span>`, and `<div>` elements —
 * those are legitimate error message displays.  Only className attributes on
 * button elements and the Button atom are checked.
 */
function hasAdHocErrorColour(source: string): boolean {
  const lines = source.split("\n");
  for (const line of lines) {
    // Skip lines that are part of a paragraph, span, or div (error message display)
    if (/^\s*[{(<]?(?:p|span|div)\b/.test(line.trim())) continue;
    if (/\bp\s+className=/.test(line)) continue;
    if (/<(?:p|span|div)\s/.test(line)) continue;
    // Check for ad-hoc error colour in the remaining lines
    if (/(?:^|[\s"'`{,])(?:hover:|focus:|active:)?(?:text|bg)-\[var\(--color-error\)\]/.test(line)) {
      return true;
    }
  }
  return false;
}

const CALL_SITES: { name: string; file: string[] }[] = [
  {
    name: "AcademicSectionLifecycleActions",
    file: ["components", "organisms", "AcademicSectionLifecycleActions.tsx"],
  },
  {
    name: "AcademicCohortLifecycleBar",
    file: ["components", "organisms", "AcademicCohortLifecycleBar.tsx"],
  },
  {
    name: "DeletePortalMessageButton",
    file: ["components", "dashboard", "DeletePortalMessageButton.tsx"],
  },
  {
    name: "DeleteUsersConfirmModal",
    file: ["components", "dashboard", "DeleteUsersConfirmModal.tsx"],
  },
  {
    name: "BlogArticleEditorDeleteControls",
    file: [
      "components",
      "dashboard",
      "admin",
      "cms",
      "blog",
      "BlogArticleEditorDeleteControls.tsx",
    ],
  },
  {
    name: "AdminEventAttendeeDeleteButton",
    file: [
      "components",
      "dashboard",
      "admin",
      "events",
      "AdminEventAttendeeDeleteButton.tsx",
    ],
  },
  {
    name: "SectionCollectionsScholarshipRemoveButton",
    file: [
      "components",
      "dashboard",
      "admin",
      "finance",
      "SectionCollectionsScholarshipRemoveButton.tsx",
    ],
  },
  {
    name: "ConfirmActionModal",
    file: ["components", "molecules", "ConfirmActionModal.tsx"],
  },
];

describe("No ad-hoc destructive styling remains", () => {
  for (const { name, file } of CALL_SITES) {
    it(`${name} contains no text-[var(--color-error)] or bg-[var(--color-error)] className`, () => {
      const src = readComponent(...file);
      expect(
        hasAdHocErrorColour(src),
        `${name} still contains ad-hoc error colour styling. ` +
          `Migrate it to variant="destructive" or variant="destructiveStrong".`,
      ).toBe(false);
    });
  }
});
