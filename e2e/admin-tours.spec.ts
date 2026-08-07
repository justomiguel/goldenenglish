import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { listTourRuntimeChecks } from "../src/lib/admin-tutorials/listTourRuntimeChecks";
import { adminTourSelector } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/**
 * L3: live routes on the isolated e2e stack only.
 * Driven by `listTourRuntimeChecks()` — every screen + task tour must appear there (rule 33).
 * Precommit (E2E_REQUIRE=1) fails closed; without require, skips when not isolated.
 */
test.describe("@admin-tours (isolated stack)", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) {
      throw new Error(requireFailure);
    }
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Isolated auth not ready — run auth setup with seeded e2e admin");
  });

  for (const check of listTourRuntimeChecks()) {
    test(`${check.id} exposes expected data-tour anchors`, async ({ page }) => {
      const locale = isolation.ok ? isolation.locale : "es";
      const cohortId = process.env.E2E_COHORT_ID?.trim();
      const sectionId = process.env.E2E_SECTION_ID?.trim();
      const studentId = process.env.E2E_STUDENT_ID?.trim();
      const eventId = process.env.E2E_EVENT_ID?.trim();
      const receiptId = process.env.E2E_RECEIPT_ID?.trim();
      const path = check.pathFor(locale, {
        cohortId,
        sectionId,
        studentId,
        eventId,
        receiptId,
      });
      test.skip(
        path == null,
        `${check.id} needs E2E_COHORT_ID / E2E_SECTION_ID / E2E_STUDENT_ID / E2E_EVENT_ID / E2E_RECEIPT_ID on the isolated seed`,
      );

      test.setTimeout(120_000);
      await gotoIsolated(page, path!);
      const first = page.locator(adminTourSelector(check.anchors[0]!)).first();
      // Cold webpack compile can leave the first paint empty; one reload recovers.
      if (!(await first.isVisible().catch(() => false))) {
        await page.reload({ waitUntil: "domcontentloaded" });
      }
      for (const anchor of check.anchors) {
        await expect(
          page.locator(adminTourSelector(anchor)).first(),
          `${check.id} missing [data-tour="${anchor}"] on ${path}`,
        ).toBeVisible({ timeout: 20_000 });
      }
    });
  }
});
