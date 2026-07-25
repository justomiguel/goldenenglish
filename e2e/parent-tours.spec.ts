import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { listParentTourRuntimeChecks } from "../src/lib/parent-tutorials/listTourRuntimeChecks";
import { parentTourSelector } from "../src/lib/parent-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/**
 * L3: live parent routes on the isolated e2e stack only.
 * Driven by `listParentTourRuntimeChecks()` — every screen + task tour must appear there (rule 36).
 */
test.describe("@parent-tours (isolated stack)", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) {
      throw new Error(requireFailure);
    }
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Isolated auth not ready — run auth setup with seeded e2e parent");
  });

  for (const check of listParentTourRuntimeChecks()) {
    test(`${check.id} exposes expected data-tour anchors`, async ({ page }) => {
      const locale = isolation.ok ? isolation.locale : "es";
      const studentId = process.env.E2E_STUDENT_ID?.trim();
      const path = check.pathFor(locale, { studentId });
      test.skip(
        path == null,
        `${check.id} needs E2E_STUDENT_ID on the isolated seed`,
      );

      await page.goto(path!);
      const first = page.locator(parentTourSelector(check.anchors[0]!)).first();
      if (!(await first.isVisible().catch(() => false))) {
        await page.reload({ waitUntil: "domcontentloaded" });
      }
      for (const anchor of check.anchors) {
        await expect(
          page.locator(parentTourSelector(anchor)).first(),
          `${check.id} missing [data-tour="${anchor}"] on ${path}`,
        ).toBeVisible({ timeout: 15_000 });
      }
    });
  }
});
