import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-create-cohort", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin can create a cohort from the academic hub", async ({ page }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const cohortName = `E2E Cohort ${suffix}`;

    await page.goto(`/${locale}/dashboard/admin/academic`);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.academicTitle))).toBeVisible({
      timeout: 20_000,
    });

    await page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohort)).click();
    await expect(page.locator("#nc-name")).toBeVisible({ timeout: 10_000 });
    await page.locator("#nc-name").fill(cohortName);
    await page.locator("#nc-slug").fill(`e2e-cohort-${suffix}`);

    await page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohortSubmit)).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/academic\/[0-9a-f-]{36}/i, {
      timeout: 90_000,
    });
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail))).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(cohortName).first()).toBeVisible({ timeout: 20_000 });
  });
});
